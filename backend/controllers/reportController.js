const mongoose = require('mongoose');
const Book = require('../models/Book');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Reservation = require('../models/Reservation');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const { generateCSV, generatePDFReport } = require('../utils/exportService');

/**
 * @desc    Get system-wide overview statistics for Admin & Librarian Dashboard
 * @route   GET /api/reports/dashboard
 * @access  Private (Admin & Librarian)
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Book stock totals
    const bookAggregation = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalTitles: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          totalAvailableCopies: { $sum: '$availableCopies' },
        },
      },
    ]);

    const bookStats = bookAggregation[0] || {
      totalTitles: 0,
      totalCopies: 0,
      totalAvailableCopies: 0,
    };

    // 2. Transaction counts
    const issuedBooks = await Transaction.countDocuments({ status: 'issued' });
    const overdueBooks = await Transaction.countDocuments({ status: 'overdue' });
    const totalTransactions = await Transaction.countDocuments();

    // 3. User counts
    const totalMembers = await User.countDocuments({ role: 'member' });
    const totalLibrarians = await User.countDocuments({ role: 'librarian' });

    // 4. Fine financial aggregates
    const fineStats = await Transaction.aggregate([
      { $match: { fineAmount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          finesCollected: {
            $sum: { $cond: [{ $eq: ['$finePaid', true] }, '$fineAmount', 0] },
          },
          pendingFines: {
            $sum: { $cond: [{ $eq: ['$finePaid', false] }, '$fineAmount', 0] },
          },
          totalFinesAssessed: { $sum: '$fineAmount' },
        },
      },
    ]);

    const fineFinancials = fineStats[0] || {
      finesCollected: 0,
      pendingFines: 0,
      totalFinesAssessed: 0,
    };

    // 5. Active Reservations
    const activeReservations = await Reservation.countDocuments({
      status: { $in: ['pending', 'available'] },
    });

    // 6. Most borrowed books (Top 5)
    const mostBorrowedBooks = await Transaction.aggregate([
      { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails',
        },
      },
      { $unwind: '$bookDetails' },
      {
        $project: {
          _id: '$bookDetails._id',
          title: '$bookDetails.title',
          author: '$bookDetails.author',
          isbn: '$bookDetails.isbn',
          coverImage: '$bookDetails.coverImage',
          borrowCount: 1,
        },
      },
    ]);

    // 7. Recent Circulation Activity (Latest 8 transactions)
    const recentActivity = await Transaction.find()
      .populate('book', 'title author')
      .populate('member', 'name email memberId')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      success: true,
      stats: {
        totalBooks: bookStats.totalTitles,
        totalCopies: bookStats.totalCopies,
        totalAvailableCopies: bookStats.totalAvailableCopies,
        issuedBooks,
        overdueBooks,
        totalMembers,
        totalLibrarians,
        finesCollected: fineFinancials.finesCollected,
        pendingFines: fineFinancials.pendingFines,
        totalFinesAssessed: fineFinancials.totalFinesAssessed,
        activeReservations,
        totalTransactions,
      },
      mostBorrowedBooks,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personalized member dashboard data
 * @route   GET /api/reports/member-dashboard
 * @access  Private (Member)
 */
const getMemberDashboard = async (req, res, next) => {
  try {
    const memberId = req.user._id;

    // 1. Current active loans
    const activeLoans = await Transaction.find({
      member: memberId,
      status: { $in: ['issued', 'overdue'] },
    })
      .populate('book', 'title author isbn coverImage shelfLocation')
      .sort({ dueDate: 1 });

    // 2. Active reservations
    const reservations = await Reservation.find({
      member: memberId,
      status: { $in: ['pending', 'available'] },
    })
      .populate('book', 'title author coverImage shelfLocation')
      .sort({ createdAt: -1 });

    // 3. Fines breakdown
    const fines = await Transaction.find({
      member: memberId,
      fineAmount: { $gt: 0 },
    });

    const totalPaidFine = fines
      .filter((f) => f.finePaid)
      .reduce((acc, f) => acc + f.fineAmount, 0);

    const pendingFine = fines
      .filter((f) => !f.finePaid)
      .reduce((acc, f) => acc + f.fineAmount, 0);

    // 4. Borrowing History Count
    const totalBorrowedHistory = await Transaction.countDocuments({ member: memberId });

    // 5. Recent notifications
    const recentNotifications = await Notification.find({ recipient: memberId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        activeLoansCount: activeLoans.length,
        activeReservationsCount: reservations.length,
        totalBorrowedHistory,
        pendingFine,
        totalPaidFine,
      },
      activeLoans,
      reservations,
      recentNotifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate reports (JSON, CSV, or PDF)
 * @route   GET /api/reports/:type
 * @access  Private (Admin & Librarian)
 */
const getReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query; // json | csv | pdf

    let reportTitle = '';
    let columns = [];
    let reportData = [];
    let summaryNotes = [];

    switch (type) {
      // 1. Most Borrowed Books
      case 'most-borrowed': {
        reportTitle = 'Most Borrowed Books Report';
        columns = [
          { label: 'Book Title', key: 'title', width: 200 },
          { label: 'Author', key: 'author', width: 140 },
          { label: 'ISBN', key: 'isbn', width: 100 },
          { label: 'Times Borrowed', key: 'borrowCount', width: 75 },
        ];

        const aggregated = await Transaction.aggregate([
          { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
          { $sort: { borrowCount: -1 } },
          { $limit: 50 },
          {
            $lookup: {
              from: 'books',
              localField: '_id',
              foreignField: '_id',
              as: 'book',
            },
          },
          { $unwind: '$book' },
        ]);

        reportData = aggregated.map((item) => ({
          title: item.book.title,
          author: item.book.author,
          isbn: item.book.isbn,
          borrowCount: item.borrowCount,
        }));

        summaryNotes = [
          `Total Ranked Titles: ${reportData.length}`,
          `Most Popular Book: ${reportData[0] ? `${reportData[0].title} (${reportData[0].borrowCount} borrows)` : 'N/A'}`,
        ];
        break;
      }

      // 2. Overdue Books
      case 'overdue-books': {
        reportTitle = 'Overdue Circulation Report';
        columns = [
          { label: 'Book Title', key: 'title', width: 160 },
          { label: 'Borrower Name', key: 'memberName', width: 110 },
          { label: 'Member ID', key: 'memberId', width: 75 },
          { label: 'Due Date', key: 'dueDate', width: 85 },
          { label: 'Days Late', key: 'overdueDays', width: 45 },
          { label: 'Fine (₹)', key: 'fineAmount', width: 40 },
        ];

        const now = new Date();
        const settings = await Settings.getSettings();

        const overdueTx = await Transaction.find({
          status: { $in: ['issued', 'overdue'] },
          dueDate: { $lt: now },
        })
          .populate('book', 'title isbn')
          .populate('member', 'name email memberId phone')
          .sort({ dueDate: 1 });

        reportData = overdueTx.map((tx) => {
          const diffDays = Math.ceil((now.getTime() - new Date(tx.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          const fine = diffDays * settings.finePerDay;
          return {
            title: tx.book ? tx.book.title : 'Deleted Book',
            memberName: tx.member ? tx.member.name : 'Unknown',
            memberId: tx.member ? tx.member.memberId || '-' : '-',
            dueDate: tx.dueDate,
            overdueDays: diffDays,
            fineAmount: fine,
          };
        });

        const totalOverdueFine = reportData.reduce((acc, r) => acc + r.fineAmount, 0);
        summaryNotes = [
          `Total Overdue Items: ${reportData.length}`,
          `Total Cumulative Accrued Fine: ₹${totalOverdueFine}`,
        ];
        break;
      }

      // 3. Member Borrowing History
      case 'member-history': {
        reportTitle = 'Member Borrowing History Report';
        columns = [
          { label: 'Borrower', key: 'memberName', width: 120 },
          { label: 'Member ID', key: 'memberId', width: 70 },
          { label: 'Book Title', key: 'title', width: 155 },
          { label: 'Issue Date', key: 'issueDate', width: 75 },
          { label: 'Return Date', key: 'returnDate', width: 75 },
          { label: 'Status', key: 'status', width: 60 },
        ];

        const query = {};
        if (req.query.memberId) query.member = req.query.memberId;

        const transactions = await Transaction.find(query)
          .populate('book', 'title author')
          .populate('member', 'name memberId')
          .sort({ createdAt: -1 })
          .limit(100);

        reportData = transactions.map((t) => ({
          memberName: t.member ? t.member.name : 'Unknown',
          memberId: t.member ? t.member.memberId || '-' : '-',
          title: t.book ? t.book.title : 'Deleted Book',
          issueDate: t.issueDate,
          returnDate: t.returnDate ? t.returnDate : 'In Loan',
          status: t.status.toUpperCase(),
        }));

        summaryNotes = [`Total Historical Records Displayed: ${reportData.length}`];
        break;
      }

      // 4. Monthly Issue Count
      case 'monthly-issues': {
        reportTitle = 'Monthly Book Circulation Report';
        columns = [
          { label: 'Year - Month', key: 'monthYear', width: 200 },
          { label: 'Total Books Issued', key: 'issueCount', width: 150 },
          { label: 'Distinct Members', key: 'distinctMembers', width: 165 },
        ];

        const monthlyStats = await Transaction.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$issueDate' },
                month: { $month: '$issueDate' },
              },
              issueCount: { $sum: 1 },
              members: { $addToSet: '$member' },
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 },
        ]);

        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        reportData = monthlyStats.map((stat) => ({
          monthYear: `${monthNames[stat._id.month]} ${stat._id.year}`,
          issueCount: stat.issueCount,
          distinctMembers: stat.members.length,
        }));

        const grandTotal = reportData.reduce((acc, r) => acc + r.issueCount, 0);
        summaryNotes = [`Cumulative Issues Across Periods: ${grandTotal}`];
        break;
      }

      // 5. Available Stock Reports
      case 'stock-report': {
        reportTitle = 'Library Catalog Stock & Availability Report';
        columns = [
          { label: 'Book Title', key: 'title', width: 170 },
          { label: 'Author', key: 'author', width: 120 },
          { label: 'Category', key: 'categoryName', width: 105 },
          { label: 'Shelf Location', key: 'shelfLocation', width: 70 },
          { label: 'Avail / Total', key: 'stockRatio', width: 50 },
        ];

        const books = await Book.find().populate('category', 'name').sort({ title: 1 });
        reportData = books.map((b) => ({
          title: b.title,
          author: b.author,
          categoryName: b.category ? b.category.name : 'General',
          shelfLocation: b.shelfLocation,
          stockRatio: `${b.availableCopies} / ${b.totalCopies}`,
        }));

        const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
        const totalAvail = books.reduce((acc, b) => acc + b.availableCopies, 0);
        summaryNotes = [
          `Total Titles: ${books.length}`,
          `Total Inventory: ${totalCopies} copies`,
          `Available On Shelf: ${totalAvail} copies`,
        ];
        break;
      }

      // 6. Fine Collection Reports
      case 'fine-collections': {
        reportTitle = 'Fine Collections & Outstanding Receivables Report';
        columns = [
          { label: 'Borrower', key: 'memberName', width: 120 },
          { label: 'Book Title', key: 'title', width: 160 },
          { label: 'Fine (₹)', key: 'fineAmount', width: 65 },
          { label: 'Settlement Status', key: 'finePaidStatus', width: 90 },
          { label: 'Recorded Date', key: 'returnDate', width: 80 },
        ];

        const fineTx = await Transaction.find({ fineAmount: { $gt: 0 } })
          .populate('book', 'title')
          .populate('member', 'name memberId')
          .sort({ createdAt: -1 });

        reportData = fineTx.map((f) => ({
          memberName: f.member ? f.member.name : 'Unknown',
          title: f.book ? f.book.title : 'N/A',
          fineAmount: `₹${f.fineAmount}`,
          finePaidStatus: f.finePaid ? 'PAID' : 'PENDING',
          returnDate: f.returnDate || f.dueDate,
        }));

        const totalCollected = fineTx
          .filter((t) => t.finePaid)
          .reduce((acc, t) => acc + t.fineAmount, 0);
        const totalPending = fineTx
          .filter((t) => !t.finePaid)
          .reduce((acc, t) => acc + t.fineAmount, 0);

        summaryNotes = [
          `Total Assessed Records: ${fineTx.length}`,
          `Total Fine Collected: ₹${totalCollected}`,
          `Outstanding Pending Fine: ₹${totalPending}`,
        ];
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown report type '${type}'. Valid options are: most-borrowed, overdue-books, member-history, monthly-issues, stock-report, fine-collections.`,
        });
    }

    // Export Handling: CSV
    if (format === 'csv') {
      const csvString = generateCSV(reportData, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="library-report-${type}-${Date.now()}.csv"`
      );
      return res.status(200).send(csvString);
    }

    // Export Handling: PDF
    if (format === 'pdf') {
      const doc = generatePDFReport({
        title: reportTitle,
        columns,
        data: reportData,
        summaryNotes,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="library-report-${type}-${Date.now()}.pdf"`
      );
      doc.pipe(res);
      doc.end();
      return;
    }

    // Default: JSON response
    res.json({
      success: true,
      reportType: type,
      title: reportTitle,
      count: reportData.length,
      columns,
      summaryNotes,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getMemberDashboard,
  getReport,
};
