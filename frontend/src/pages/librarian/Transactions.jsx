import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { History, Search, Receipt, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [payingFineId, setPayingFineId] = useState(null);

  const { showSuccess, showError } = useToast();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await apiClient.get('/transactions', { params });
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setPagination({ total: res.data.total, pages: res.data.pages });
      }
    } catch (err) {
      showError('Failed to fetch transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  const handlePayFine = async (txId) => {
    setPayingFineId(txId);
    try {
      const res = await apiClient.put(`/transactions/${txId}/pay-fine`);
      if (res.data.success) {
        showSuccess(res.data.message || 'Fine marked as paid.');
        fetchTransactions();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to settle fine.');
    } finally {
      setPayingFineId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Master Circulation Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Real-time audit log of all book checkouts, returns, renewal histories, and desk fine collections.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['all', 'active', 'returned', 'overdue'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Borrower (Member ID)</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4">Fine Status</th>
                    <th className="py-3 px-4 text-center">Loan Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                        {tx.book?.title || 'Unknown Title'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <p className="font-semibold">{tx.member?.name || 'Member'}</p>
                        <p className="text-[10px] font-mono text-slate-400">{tx.member?.memberId || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(tx.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {tx.fineAmount > 0 ? (
                          <div className="space-y-0.5">
                            <span className={`font-bold ${tx.finePaid ? 'text-slate-500' : 'text-rose-600'}`}>
                              ₹{tx.fineAmount} {tx.finePaid ? '(Paid)' : '(Unpaid)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                      <td className="py-3 px-4 text-right">
                        {tx.fineAmount > 0 && !tx.finePaid && (
                          <button
                            onClick={() => handlePayFine(tx._id)}
                            disabled={payingFineId === tx._id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition disabled:opacity-50"
                          >
                            {payingFineId === tx._id ? 'Settling...' : 'Collect ₹' + tx.fineAmount}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing Page {page} of {pagination.pages} ({pagination.total} Records)
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
            <p className="text-sm">No transaction records match the filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
