import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Clock, CheckCircle2, XCircle, AlertCircle, BookOpen, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchReservations = async () => {
    try {
      const res = await apiClient.get('/reservations/my');
      if (res.data.success) {
        setReservations(res.data.reservations || []);
      }
    } catch (err) {
      showError('Failed to fetch reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

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
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-emerald-600" />
          My Book Reservations
        </h1>
        <p className="text-xs text-slate-500">
          Monitor your First-Come, First-Served queue position and pickup deadlines for reserved titles.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : reservations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {reservations.map((item) => {
              const isAvailable = item.status === 'available';
              const isPending = item.status === 'pending';
              const canCancel = ['pending', 'available'].includes(item.status);

              return (
                <div key={item._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                      {item.book?.coverImage ? (
                        <img src={item.book.coverImage} alt={item.book.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.book?.title}</h4>
                      <p className="text-xs text-slate-500">by {item.book?.author}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Reserved: {new Date(item.reservedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-sans">Shelf: {item.book?.shelfLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      {isAvailable ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready for Collection!
                          </span>
                          {item.expiresAt && (
                            <p className="text-[10px] text-rose-600 font-bold">
                              Collect before: {new Date(item.expiresAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : isPending ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Queue Position #{item.queuePosition || 1}
                          </span>
                          <p className="text-[10px] text-slate-400">Waiting for next book return</p>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 rounded-full bg-slate-100">
                          {item.status}
                        </span>
                      )}
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => setCancelModalItem(item)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                        title="Cancel Reservation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm">You have no active or historical reservations.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalItem}
        onClose={() => setCancelModalItem(null)}
        title="Cancel Book Reservation"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to cancel your reservation for <strong>'{cancelModalItem?.book?.title}'</strong>?
          </p>
          <p className="text-slate-500">
            You will lose your queue position. If a copy is currently held for you, it will be released to the next member in line.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setCancelModalItem(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Keep Reservation
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={cancelling}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
