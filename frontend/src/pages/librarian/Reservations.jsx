import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Clock, Search, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await apiClient.get('/reservations', { params });
      if (res.data.success) {
        setReservations(res.data.reservations || []);
        setPagination({ total: res.data.total, pages: res.data.pages });
      }
    } catch (err) {
      showError('Failed to fetch reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [page, statusFilter]);

  const handleCancelConfirm = async () => {
    if (!cancelModalItem) return;
    setCancelling(true);
    try {
      const res = await apiClient.delete(`/reservations/${cancelModalItem._id}`);
      if (res.data.success) {
        showSuccess('Reservation cancelled.');
        setCancelModalItem(null);
        fetchReservations();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Book Reservations Queue
          </h1>
          <p className="text-xs text-slate-500">
            Automated First-Come, First-Served queue management, 48-hour pickup window timers, and holds.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'pending', 'available', 'fulfilled', 'cancelled', 'expired'].map((st) => (
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : reservations.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Member Name & ID</th>
                    <th className="py-3 px-4">Reserved Date</th>
                    <th className="py-3 px-4">Pickup Deadline</th>
                    <th className="py-3 px-4 text-center">Queue Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((r) => {
                    const isAvailable = r.status === 'available';
                    const isPending = r.status === 'pending';

                    return (
                      <tr key={r._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                          {r.book?.title || 'Unknown Title'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{r.member?.name || 'Member'}</p>
                          <p className="text-[10px] font-mono text-slate-400">{r.member?.memberId || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {new Date(r.reservedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {r.expiresAt ? (
                            <span className="font-bold text-rose-600">
                              {new Date(r.expiresAt).toLocaleDateString()} ({new Date(r.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          ) : (
                            <span className="text-slate-400">Waiting return</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {['pending', 'available'].includes(r.status) && (
                            <button
                              onClick={() => setCancelModalItem(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Cancel / Release Reservation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing Page {page} of {pagination.pages} ({pagination.total} Reservations)
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
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm">No reservations found.</p>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalItem}
        onClose={() => setCancelModalItem(null)}
        title="Cancel Reservation"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Cancel reservation for <strong>'{cancelModalItem?.book?.title}'</strong> held by <strong>{cancelModalItem?.member?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setCancelModalItem(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Back
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={cancelling}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
