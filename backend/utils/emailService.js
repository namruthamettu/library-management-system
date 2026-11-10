const nodemailer = require('nodemailer');

// Configure reusable transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER || 'library.system.demo@gmail.com',
        pass: process.env.EMAIL_PASS || 'demopassword123',
      },
    });
  }
  return transporter;
};

/**
 * Safe email dispatcher: sends email if configured, logs gracefully to console in development
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || '"Central Library" <no-reply@library.edu>';

  // In development with placeholder credentials, log clean console preview
  const isDemo =
    !process.env.EMAIL_USER ||
    process.env.EMAIL_USER.includes('example.com') ||
    process.env.EMAIL_USER.includes('demo');

  if (isDemo && process.env.NODE_ENV !== 'production') {
    console.log(`\n[Email Notification Sim]: To: ${to} | Subject: "${subject}"`);
    console.log(`[Email Preview]: ${text || 'HTML Email Body'}\n`);
    return { simulated: true, to, subject };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Sent]: Message ID: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.error(`[Email Dispatch Notice]: Could not send to ${to}: ${error.message}`);
    return { error: error.message };
  }
};

/**
 * 1. Due Date Reminder Email (Sent 2 days prior to due date)
 */
const sendDueDateReminderEmail = async (toEmail, memberName, bookTitle, dueDate) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Library Reminder: '${bookTitle}' is due in 2 days`;
  const text = `Dear ${memberName},\n\nThis is a friendly reminder that your borrowed book '${bookTitle}' is due for return on ${formattedDate}.\n\nPlease return or renew it to avoid overdue fines.\n\nBest regards,\nCentral Library Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 8px;">Central Library Notification</h2>
      <p>Dear <strong>${memberName}</strong>,</p>
      <p>This is a reminder that the following borrowed book is due in <strong>2 days</strong>:</p>
      <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0;">
        <p style="margin: 4px 0;"><strong>Book Title:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0;"><strong>Due Date:</strong> ${formattedDate}</p>
      </div>
      <p>Please return the book to the library circulation desk or renew it via your student portal to avoid overdue fines.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Central Library Management System &bull; Automated Notification</p>
    </div>
  `;

  return await sendEmail({ to: toEmail, subject, text, html });
};

/**
 * 2. Overdue Book Reminder Email (Daily overdue alerts)
 */
const sendOverdueReminderEmail = async (toEmail, memberName, bookTitle, dueDate, overdueDays, fineAmount) => {
  const subject = `URGENT: '${bookTitle}' is Overdue by ${overdueDays} Day(s)`;
  const text = `Dear ${memberName},\n\nYour borrowed book '${bookTitle}' is overdue by ${overdueDays} day(s).\nAccrued Fine: ₹${fineAmount}.\n\nPlease return the book immediately to prevent further fine accrual.\n\nCentral Library Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px;">
      <h2 style="color: #b91c1c; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">Overdue Book Notice</h2>
      <p>Dear <strong>${memberName}</strong>,</p>
      <p style="color: #991b1b;">The borrowing period for the following book has expired:</p>
      <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0;">
        <p style="margin: 4px 0;"><strong>Book Title:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0;"><strong>Days Overdue:</strong> ${overdueDays} day(s)</p>
        <p style="margin: 4px 0;"><strong>Current Accrued Fine:</strong> <span style="font-size: 16px; color: #dc2626; font-weight: bold;">₹${fineAmount}</span></p>
      </div>
      <p>Please return this item to the circulation desk immediately. Further borrowing privileges will be suspended if unpaid fines exceed the institutional limit.</p>
      <hr style="border: none; border-top: 1px solid #fee2e2; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Central Library Management System &bull; Automated Overdue Notice</p>
    </div>
  `;

  return await sendEmail({ to: toEmail, subject, text, html });
};

/**
 * 3. Reservation Availability Email (Book ready for collection)
 */
const sendReservationAvailableEmail = async (toEmail, memberName, bookTitle, expiresAt) => {
  const formattedExpiry = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Your Reserved Book '${bookTitle}' is Ready for Collection!`;
  const text = `Dear ${memberName},\n\nGreat news! Your reserved book '${bookTitle}' is now available for collection at the Central Library desk.\n\nPlease collect it before ${formattedExpiry} (held for 48 hours).\n\nCentral Library Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #dcfce7; border-radius: 8px;">
      <h2 style="color: #15803d; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">Reserved Book Ready for Collection</h2>
      <p>Dear <strong>${memberName}</strong>,</p>
      <p>Great news! A copy of your reserved book has been returned and is waiting for you at the library circulation desk:</p>
      <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 15px 0;">
        <p style="margin: 4px 0;"><strong>Book Title:</strong> ${bookTitle}</p>
        <p style="margin: 4px 0;"><strong>Pickup Deadline:</strong> <strong>${formattedExpiry}</strong> (48 Hours)</p>
      </div>
      <p>Please present your Member ID at the circulation desk to collect your copy. If not collected before the deadline, the reservation will automatically expire and pass to the next member in queue.</p>
      <hr style="border: none; border-top: 1px solid #dcfce7; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Central Library Management System &bull; Automated Reservation Service</p>
    </div>
  `;

  return await sendEmail({ to: toEmail, subject, text, html });
};

/**
 * 4. Reservation Expired Email
 */
const sendReservationExpiredEmail = async (toEmail, memberName, bookTitle) => {
  const subject = `Reservation Expired: '${bookTitle}'`;
  const text = `Dear ${memberName},\n\nYour 48-hour pickup window for '${bookTitle}' has expired. The book has been offered to the next member or returned to open circulation.\n\nCentral Library Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #64748b; border-bottom: 2px solid #94a3b8; padding-bottom: 8px;">Reservation Expired</h2>
      <p>Dear <strong>${memberName}</strong>,</p>
      <p>Your 48-hour collection window for <strong>'${bookTitle}'</strong> has expired as the book was not collected at the desk.</p>
      <p>The reservation has been cancelled and the book made available to the next member in the queue.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Central Library Management System</p>
    </div>
  `;

  return await sendEmail({ to: toEmail, subject, text, html });
};

module.exports = {
  sendEmail,
  sendDueDateReminderEmail,
  sendOverdueReminderEmail,
  sendReservationAvailableEmail,
  sendReservationExpiredEmail,
};
