import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import {
  BookMarked,
  Clock,
  Receipt,
  History,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  Bell,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export default function MemberDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/reports/member-dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      showError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRenew = async (txId) => {
    setRenewingId(txId);
    try {
      const res = await apiClient.put(`/transactions/${txId}/renew`);
      if (res.data.success) {
        showSuccess(res.data.message || 'Book renewed successfully!');
        fetchDashboard();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to renew book.');
    } finally {
      setRenewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const activeLoans = data?.activeLoans || [];
  const reservations = data?.reservations || [];
  const notifications = data?.recentNotifications || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Student & Faculty Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Institutional Member ID: <strong className="font-mono text-white">{user?.memberId || 'N/A'}</strong>
          </p>
        </div>
        <Link
          to="/catalogue"
          className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow hover:bg-emerald-50 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Browse Catalogue
        </Link>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Loans"
          value={stats.activeLoansCount || 0}
          subtitle="Currently borrowed"
          icon={BookMarked}
          color="emerald"
        />
        <StatCard
          title="Active Reservations"
          value={stats.activeReservationsCount || 0}
          subtitle="In waitlist queue"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Pending Dues"
          value={`₹${stats.pendingFine || 0}`}
          subtitle="Unpaid overdue fines"
          icon={Receipt}
          color={stats.pendingFine > 0 ? 'rose' : 'blue'}
        />
        <StatCard
          title="Borrowing Trail"
          value={stats.totalBorrowedHistory || 0}
          subtitle="Total books issued"
          icon={History}
          color="purple"
        />
      </div>

      {/* Main Circulation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Currently Borrowed Books (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-600" />
              Currently Borrowed Books
            </h2>
            <Link
              to="/member/borrowed"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All ({activeLoans.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {activeLoans.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {activeLoans.map((loan) => {
                  const now = new Date();
                  const dueDate = new Date(loan.dueDate);
                  const isOverdue = now > dueDate;
                  const diffDays = Math.ceil(Math.abs(now - dueDate) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={loan._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                          {loan.book?.coverImage ? (
                            <img src={loan.book.coverImage} alt={loan.book.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{loan.book?.title}</h4>
                          <p className="text-xs text-slate-500">by {loan.book?.author}</p>
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="font-mono text-slate-400">ISBN: {loan.book?.isbn}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">Shelf: {loan.book?.shelfLocation}</span>
                          </div>
                        </div>
                      </div>

                      {/* Due date & renew */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Due Date</p>
                          <p className="text-xs font-bold text-slate-800">
                            {dueDate.toLocaleDateString()}
                          </p>
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" /> Overdue by {diffDays}d
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-600">
                              {diffDays} day(s) remaining
                            </span>
                          )}
                        </div>

                        {loan.renewCount < 1 && !isOverdue && (
                          <button
                            onClick={() => handleRenew(loan._id)}
                            disabled={renewingId === loan._id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${renewingId === loan._id ? 'animate-spin' : ''}`} />
                            Renew
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-medium">You currently have no active book loans.</p>
                <Link to="/catalogue" className="text-xs font-bold text-emerald-600 hover:underline">
                  Browse catalogue to borrow books
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (1 Col) */}
        <div className="space-y-6">
          {/* Active Reservations Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Active Reservations
              </h3>
              <Link to="/member/reservations" className="text-xs font-semibold text-emerald-600 hover:underline">
                View All
              </Link>
            </div>

            {reservations.length > 0 ? (
              <div className="space-y-2.5">
                {reservations.slice(0, 3).map((res) => (
                  <div key={res._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <p className="font-bold text-slate-800 truncate">{res.book?.title}</p>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">
                        {res.status === 'available' ? (
                          <strong className="text-emerald-600">Ready for Collection!</strong>
                        ) : (
                          'Waiting in Queue'
                        )}
                      </span>
                      <span className="font-bold px-2 py-0.5 rounded uppercase text-[9px] bg-amber-100 text-amber-800">
                        {res.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No active reservations.</p>
            )}
          </div>

          {/* Recent In-App Alerts Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                Notifications
              </h3>
              <Link to="/member/notifications" className="text-xs font-semibold text-emerald-600 hover:underline">
                History
              </Link>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No recent alerts.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
