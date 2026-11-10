const cron = require('node-cron');

const Transaction = require('../models/Transaction');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');

const {
    sendDueDateReminderEmail,
    sendOverdueReminderEmail,
    sendReservationAvailableEmail,
    sendReservationExpiredEmail,
} = require('../utils/emailService');

const TIMEZONE = 'Asia/Kolkata';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

/**
 * Helper: Send email safely.
 * An email failure should not stop the entire cron job.
 */
const sendEmailSafely = async (emailFunction, ...args) => {
    try {
        await emailFunction(...args);
        return true;
    } catch (error) {
        console.error('[Email Error]:', error.message);
        return false;
    }
};

/**
 * Helper: Create notification safely.
 */
const createNotificationSafely = async (notificationData) => {
    try {
        await Notification.create(notificationData);
        return true;
    } catch (error) {
        console.error('[Notification Error]:', error.message);
        return false;
    }
};

/**
 * TASK 1:
 * Check books due within the next 48 hours.
 *
 * Schedule: Every day at 08:00 AM.
 */
const checkDueDateReminders = async () => {
    try {
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + TWO_DAYS_MS);
        const oneDayAgo = new Date(now.getTime() - ONE_DAY_MS);

        const approachingTransactions = await Transaction.find({
            status: 'issued',
            dueDate: {
                $gte: now,
                $lte: twoDaysFromNow,
            },
        })
            .populate('book', 'title author')
            .populate('member', 'name email');

        let notificationCount = 0;
        let emailCount = 0;
        let skippedCount = 0;

        for (const tx of approachingTransactions) {
            try {
                if (!tx.member || !tx.book) {
                    skippedCount++;
                    continue;
                }

                const title = `Due Date Reminder: '${tx.book.title}'`;

                // Avoid duplicate reminders within 24 hours.
                const existingNotification = await Notification.findOne({
                    recipient: tx.member._id,
                    type: 'due_reminder',
                    title,
                    createdAt: {
                        $gte: oneDayAgo,
                    },
                });

                if (existingNotification) {
                    skippedCount++;
                    continue;
                }

                const notificationCreated = await createNotificationSafely({
                    recipient: tx.member._id,
                    title,
                    message:
                        `Your borrowed book '${tx.book.title}' is due on ` +
                        `${new Date(tx.dueDate).toLocaleDateString('en-IN')}. ` +
                        'Please return or renew it before the due date.',
                    type: 'due_reminder',
                    link: '/member/borrowed',
                });

                if (notificationCreated) {
                    notificationCount++;
                }

                if (tx.member.email) {
                    const emailSent = await sendEmailSafely(
                        sendDueDateReminderEmail,
                        tx.member.email,
                        tx.member.name,
                        tx.book.title,
                        tx.dueDate
                    );

                    if (emailSent) {
                        emailCount++;
                    }
                }
            } catch (error) {
                skippedCount++;
                console.error(
                    `[Due Reminder Error] Transaction ${tx._id}:`,
                    error.message
                );
            }
        }

        console.log(
            `[Cron: Due Reminders] Checked: ${approachingTransactions.length}, ` +
            `Notifications: ${notificationCount}, Emails: ${emailCount}, ` +
            `Skipped: ${skippedCount}`
        );

        return {
            checked: approachingTransactions.length,
            notifications: notificationCount,
            emails: emailCount,
            skipped: skippedCount,
        };
    } catch (error) {
        console.error('[Cron Error: Due Reminders]:', error);
        throw error;
    }
};


/**
 * TASK 2:
 * Detect overdue books and calculate fines.
 *
 * Schedule: Every day at 00:05 AM.
 */
const checkOverdueAndFines = async () => {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - ONE_DAY_MS);

        const settings = await Settings.getSettings();

        const finePerDay = Number(settings.finePerDay);

        if (!Number.isFinite(finePerDay) || finePerDay < 0) {
            throw new Error('Invalid finePerDay setting.');
        }

        const overdueTransactions = await Transaction.find({
            status: {
                $in: ['issued', 'overdue'],
            },
            dueDate: {
                $lt: now,
            },
        })
            .populate('book', 'title author')
            .populate('member', 'name email');

        let updatedCount = 0;
        let notificationCount = 0;
        let emailCount = 0;
        let skippedCount = 0;

        for (const tx of overdueTransactions) {
            try {
                if (!tx.member || !tx.book) {
                    skippedCount++;
                    continue;
                }

                const difference =
                    now.getTime() - new Date(tx.dueDate).getTime();

                const overdueDays = Math.max(
                    1,
                    Math.ceil(difference / ONE_DAY_MS)
                );

                // Calculate current overdue fine.
                const fineAmount = overdueDays * finePerDay;

                tx.status = 'overdue';
                tx.fineAmount = fineAmount;

                await tx.save();

                updatedCount++;

                const title = `Overdue Notice: '${tx.book.title}'`;

                // Avoid duplicate overdue notifications within 24 hours.
                const existingNotification = await Notification.findOne({
                    recipient: tx.member._id,
                    type: 'overdue',
                    title,
                    createdAt: {
                        $gte: oneDayAgo,
                    },
                });

                if (!existingNotification) {
                    const notificationCreated =
                        await createNotificationSafely({
                            recipient: tx.member._id,
                            title,
                            message:
                                `Your book '${tx.book.title}' is overdue by ` +
                                `${overdueDays} day(s). ` +
                                `Your current fine is ₹${fineAmount}. ` +
                                'Please return the book as soon as possible.',
                            type: 'overdue',
                            link: '/member/fines',
                        });

                    if (notificationCreated) {
                        notificationCount++;
                    }

                    if (tx.member.email) {
                        const emailSent = await sendEmailSafely(
                            sendOverdueReminderEmail,
                            tx.member.email,
                            tx.member.name,
                            tx.book.title,
                            tx.dueDate,
                            overdueDays,
                            fineAmount
                        );

                        if (emailSent) {
                            emailCount++;
                        }
                    }
                }
            } catch (error) {
                skippedCount++;
                console.error(
                    `[Overdue Error] Transaction ${tx._id}:`,
                    error.message
                );
            }
        }

        console.log(
            `[Cron: Overdue & Fines] Processed: ${overdueTransactions.length}, ` +
            `Updated: ${updatedCount}, Notifications: ${notificationCount}, ` +
            `Emails: ${emailCount}, Skipped: ${skippedCount}`
        );

        return {
            processed: overdueTransactions.length,
            updated: updatedCount,
            notifications: notificationCount,
            emails: emailCount,
            skipped: skippedCount,
        };
    } catch (error) {
        console.error('[Cron Error: Overdue & Fines]:', error);
        throw error;
    }
};


/**
 * TASK 3:
 * Expire reservations after their 48-hour collection window.
 *
 * When a reservation expires:
 * 1. Mark the old reservation as expired.
 * 2. Find the next pending reservation.
 * 3. Make the next reservation available.
 * 4. Give the next member 48 hours.
 * 5. Notify the next member.
 * 6. Return the copy to public inventory if nobody is waiting.
 *
 * Schedule: Every hour.
 */
const checkReservationExpirations = async () => {
    try {
        const now = new Date();

        const expiredReservations = await Reservation.find({
            status: 'available',
            expiresAt: {
                $lt: now,
            },
        }).select('_id book member');

        let expiredCount = 0;
        let notifiedCount = 0;
        let emailsSent = 0;
        let stockRestored = 0;
        let skippedCount = 0;

        for (const item of expiredReservations) {
            try {
                // Atomically expire the reservation.
                // This prevents two overlapping executions from processing
                // the same reservation.
                const expiredReservation =
                    await Reservation.findOneAndUpdate(
                        {
                            _id: item._id,
                            status: 'available',
                            expiresAt: {
                                $lt: new Date(),
                            },
                        },
                        {
                            $set: {
                                status: 'expired',
                                expiresAt: null,
                            },
                        },
                        {
                            new: true,
                        }
                    )
                        .populate('book', 'title author')
                        .populate('member', 'name email');

                if (!expiredReservation) {
                    continue;
                }

                expiredCount++;

                const book = expiredReservation.book;

                // Notify the member whose reservation expired.
                if (expiredReservation.member && book) {
                    await createNotificationSafely({
                        recipient: expiredReservation.member._id,
                        title: `Reservation Expired: '${book.title}'`,
                        message:
                            `Your 48-hour collection period for '${book.title}' ` +
                            'has expired. Your reservation is now closed.',
                        type: 'reservation_expired',
                        link: '/member/reservations',
                    });

                    if (expiredReservation.member.email) {
                        await sendEmailSafely(
                            sendReservationExpiredEmail,
                            expiredReservation.member.email,
                            expiredReservation.member.name,
                            book.title
                        );
                    }
                }

                if (!book) {
                    skippedCount++;
                    continue;
                }

                // Find the next eligible pending reservation.
                // Invalid member references are skipped.
                let nextReservation = null;

                while (true) {
                    const nextExpiry = new Date(
                        Date.now() + TWO_DAYS_MS
                    );

                    nextReservation =
                        await Reservation.findOneAndUpdate(
                            {
                                book: book._id,
                                status: 'pending',
                            },
                            {
                                $set: {
                                    status: 'available',
                                    expiresAt: nextExpiry,
                                },
                            },
                            {
                                new: true,
                                sort: {
                                    reservedAt: 1,
                                    _id: 1,
                                },
                            }
                        ).populate('member', 'name email');

                    if (!nextReservation) {
                        break;
                    }

                    // Skip invalid or deleted member records.
                    if (nextReservation.member) {
                        break;
                    }

                    nextReservation.status = 'cancelled';
                    nextReservation.expiresAt = null;

                    await nextReservation.save();

                    console.warn(
                        `[Reservation] Skipped reservation ${nextReservation._id}: ` +
                        'member record not found.'
                    );

                    nextReservation = null;
                }

                if (nextReservation && nextReservation.member) {
                    const nextExpiry = nextReservation.expiresAt;

                    const notificationCreated =
                        await createNotificationSafely({
                            recipient: nextReservation.member._id,
                            title: 'Reserved Book Ready for Collection',
                            message:
                                `Your reserved book '${book.title}' is now ready ` +
                                `for collection. Please collect it within 48 hours, ` +
                                `before ${nextExpiry.toLocaleString('en-IN')}.`,
                            type: 'reservation_available',
                            link: '/member/reservations',
                        });

                    if (notificationCreated) {
                        notifiedCount++;
                    }

                    if (nextReservation.member.email) {
                        const emailSent = await sendEmailSafely(
                            sendReservationAvailableEmail,
                            nextReservation.member.email,
                            nextReservation.member.name,
                            book.title,
                            nextExpiry
                        );

                        if (emailSent) {
                            emailsSent++;
                        }
                    }
                } else {
                    // Nobody is waiting.
                    // Return the reserved copy to public inventory.
                    const updatedBook = await Book.findOneAndUpdate(
                        {
                            _id: book._id,
                            $expr: {
                                $lt: ['$availableCopies', '$totalCopies'],
                            },
                        },
                        {
                            $inc: {
                                availableCopies: 1,
                            },
                        },
                        {
                            new: true,
                        }
                    );

                    if (updatedBook) {
                        stockRestored++;
                    } else {
                        console.warn(
                            `[Reservation] Could not restore stock for book ${book._id}.`
                        );
                    }
                }
            } catch (error) {
                skippedCount++;

                console.error(
                    `[Reservation Expiry Error] Reservation ${item._id}:`,
                    error.message
                );
            }
        }

        console.log(
            `[Cron: Reservation Expiry] Expired: ${expiredCount}, ` +
            `Next Members Notified: ${notifiedCount}, Emails: ${emailsSent}, ` +
            `Stock Restored: ${stockRestored}, Skipped: ${skippedCount}`
        );

        return {
            expiredCount,
            notifiedCount,
            emailsSent,
            stockRestored,
            skippedCount,
        };
    } catch (error) {
        console.error('[Cron Error: Reservation Expiry]:', error);
        throw error;
    }
};


/**
 * Initialize all cron jobs.
 */
const initCronJobs = () => {
    console.log('========================================');
    console.log('[Cron Jobs] Initializing scheduler');
    console.log(`[Cron Jobs] Timezone: ${TIMEZONE}`);
    console.log('========================================');

    // JOB 1: Due-date reminders.
    // Every day at 08:00 AM IST.
    cron.schedule(
        '0 8 * * *',
        async () => {
            console.log(
                '[Cron Trigger] Running due-date reminder scanner...'
            );

            try {
                await checkDueDateReminders();
            } catch (error) {
                console.error('[Cron Job Failed: Due Reminders]', error.message);
            }
        },
        {
            timezone: TIMEZONE,
        }
    );

    console.log('Due-date reminders: Daily at 08:00 AM IST');


    // JOB 2: Overdue detection and fine calculation.
    // Every day at 12:05 AM IST.
    cron.schedule(
        '5 0 * * *',
        async () => {
            console.log(
                '[Cron Trigger] Running overdue and fine scanner...'
            );

            try {
                await checkOverdueAndFines();
            } catch (error) {
                console.error('[Cron Job Failed: Overdue]', error.message);
            }
        },
        {
            timezone: TIMEZONE,
        }
    );

    console.log('Overdue and fines: Daily at 12:05 AM IST');


    // JOB 3: Reservation expiry.
    // Every hour at minute 0.
    cron.schedule(
        '0 * * * *',
        async () => {
            console.log(
                '[Cron Trigger] Running reservation expiry scanner...'
            );

            try {
                await checkReservationExpirations();
            } catch (error) {
                console.error(
                    '[Cron Job Failed: Reservation Expiry]',
                    error.message
                );
            }
        },
        {
            timezone: TIMEZONE,
        }
    );

    console.log('Reservation expiry: Every hour');
    console.log('========================================');
    console.log('[Cron Jobs] All jobs registered successfully.');
    console.log('========================================');
};


module.exports = initCronJobs;

module.exports.checkDueDateReminders = checkDueDateReminders;
module.exports.checkOverdueAndFines = checkOverdueAndFines;
module.exports.checkReservationExpirations = checkReservationExpirations;