import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { History, BookOpen, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';

export default function BorrowingHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const { showError } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/transactions/my?page=${page}&limit=10`);
        if (res.data.success) {
          setTransactions(res.data.transactions || []);
          setPagination({ total: res.data.total, pages: res.data.pages });
        }
      } catch (err) {
        showError('Failed to fetch borrowing history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page, showError]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" />
          Complete Borrowing History
        </h1>
        <p className="text-xs text-slate-500">
          Archived ledger of all books issued, renewed, and returned under your student/faculty account.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Book Title & Author</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4">Fine Assessed</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{tx.book?.title || 'Unknown Title'}</p>
                        <p className="text-slate-400 text-[11px]">{tx.book?.author}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(tx.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.returnDate ? (
                          new Date(tx.returnDate).toLocaleDateString()
                        ) : (
                          <span className="text-emerald-600 font-semibold">Active Loan</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {tx.fineAmount > 0 ? (
                          <span className={`font-bold ${tx.finePaid ? 'text-slate-500' : 'text-rose-600'}`}>
                            ₹{tx.fineAmount} {tx.finePaid ? '(Paid)' : '(Unpaid)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing Page {page} of {pagination.pages} ({pagination.total} records)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page >= pagination.pages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm">No transaction history found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
