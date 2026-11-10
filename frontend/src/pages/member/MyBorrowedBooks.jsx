import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { BookMarked, RotateCw, AlertTriangle, CheckCircle, BookOpen, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyBorrowedBooks() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);
  const { showSuccess, showError } = useToast();

  const fetchBorrowed = async () => {
    try {
      const res = await apiClient.get('/transactions/my?status=active');
      if (res.data.success) {
        setLoans(res.data.transactions || []);
      }
    } catch (err) {
      showError('Failed to fetch borrowed books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowed();
  }, []);

  const handleRenew = async (txId) => {
    setRenewingId(txId);
    try {
      const res = await apiClient.put(`/transactions/${txId}/renew`);
      if (res.data.success) {
        showSuccess(res.data.message || 'Book renewed successfully!');
        fetchBorrowed();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Renewal rejected.');
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-emerald-600" />
          My Borrowed Books
        </h1>
        <p className="text-xs text-slate-500">
          Books currently checked out under your account. Ensure books are returned on or before their due dates.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : loans.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {loans.map((loan) => {
            const now = new Date();
            const dueDate = new Date(loan.dueDate);
            const isOverdue = now > dueDate;
            const diffDays = Math.ceil(Math.abs(now - dueDate) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={loan._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                    {loan.book?.coverImage ? (
                      <img src={loan.book.coverImage} alt={loan.book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Link
                      to={`/catalogue/${loan.book?._id}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-600 transition"
                    >
                      {loan.book?.title}
                    </Link>
                    <p className="text-xs text-slate-500">by {loan.book?.author}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 font-mono">
                      <span>ISBN: {loan.book?.isbn}</span>
                      <span>•</span>
                      <span className="font-sans">Shelf: {loan.book?.shelfLocation}</span>
                      <span>•</span>
                      <span className="font-sans">Renewed: {loan.renewCount}/1 times</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center md:justify-end gap-1">
                      <Calendar className="w-3 h-3" /> Due Date
                    </p>
                    <p className="text-sm font-bold text-slate-900">{dueDate.toLocaleDateString()}</p>
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue by {diffDays} day(s)
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">
                        {diffDays} day(s) remaining
                      </span>
                    )}
                  </div>

                  {loan.renewCount < 1 && !isOverdue ? (
                    <button
                      onClick={() => handleRenew(loan._id)}
                      disabled={renewingId === loan._id}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${renewingId === loan._id ? 'animate-spin' : ''}`} />
                      {renewingId === loan._id ? 'Renewing...' : 'Renew Loan'}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-100">
                      {isOverdue ? 'Overdue - Return to Desk' : 'Renewal Limit Reached'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No active book loans</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any borrowed books at the moment. Browse the catalog to borrow reading materials.
          </p>
          <Link
            to="/catalogue"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
          >
            Browse Catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
