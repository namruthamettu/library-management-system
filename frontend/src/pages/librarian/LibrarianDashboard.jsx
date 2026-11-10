import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import {
  BookOpen,
  Repeat,
  CheckCircle,
  AlertTriangle,
  Users,
  Receipt,
  FileBarChart,
  BookPlus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function LibrarianDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/reports/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        showError('Failed to fetch librarian dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showError]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const mostBorrowed = data?.mostBorrowedBooks || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Circulation Operations Desk
          </h1>
          <p className="text-xs text-slate-500">
            Real-time library statistics, book checkout desk, returns processing, and inventory analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/librarian/issue"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <Repeat className="w-4 h-4" /> Issue Book
          </Link>
          <Link
            to="/librarian/return"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Accept Return
          </Link>
          <Link
            to="/librarian/books/add"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition flex items-center gap-1.5"
          >
            <BookPlus className="w-4 h-4" /> Add Book
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Catalog Titles"
          value={stats.totalBooks || 0}
          subtitle={`${stats.totalCopies || 0} Total physical copies`}
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Available on Shelf"
          value={stats.totalAvailableCopies || 0}
          subtitle="Ready for immediate loan"
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Currently Issued"
          value={stats.issuedBooks || 0}
          subtitle="Active member loans"
          icon={Repeat}
          color="indigo"
        />
        <StatCard
          title="Overdue Loans"
          value={stats.overdueBooks || 0}
          subtitle="Past scheduled return date"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Registered Members"
          value={stats.totalMembers || 0}
          subtitle="Students and Faculty"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Fines Collected"
          value={`₹${stats.finesCollected || 0}`}
          subtitle="All settled payments"
          icon={Receipt}
          color="emerald"
        />
        <StatCard
          title="Pending Receivables"
          value={`₹${stats.pendingFines || 0}`}
          subtitle="Outstanding dues"
          icon={Receipt}
          color={stats.pendingFines > 0 ? 'amber' : 'blue'}
        />
        <StatCard
          title="Active Waitlist"
          value={stats.activeReservations || 0}
          subtitle="Pending book reservations"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Two Column Layout: Most Borrowed & Recent Circulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Most Borrowed Titles (1 Col) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Most Borrowed Titles
            </h3>
            <Link to="/librarian/reports" className="text-xs font-semibold text-emerald-600 hover:underline">
              Full Report
            </Link>
          </div>

          {mostBorrowed.length > 0 ? (
            <div className="space-y-3">
              {mostBorrowed.map((b, idx) => (
                <div key={b._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{b.author}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {b.borrowCount} loans
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No borrowing data recorded yet.</p>
          )}
        </div>

        {/* Recent Circulation Transactions (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-600" />
              Recent Circulation Activity
            </h3>
            <Link to="/librarian/transactions" className="text-xs font-semibold text-emerald-600 hover:underline">
              All Transactions
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Borrower</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[180px]">
                        {tx.book?.title || 'Unknown Title'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {tx.member?.name || 'Member'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            tx.status === 'returned'
                              ? 'bg-slate-100 text-slate-700'
                              : tx.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No recent circulation activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}
