import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Bell, CheckCheck, Clock, AlertTriangle, Receipt, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url = filterUnread ? '/notifications?unreadOnly=true' : '/notifications';
      const res = await apiClient.get(url);
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      showError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterUnread]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await apiClient.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      showError('Failed to update notification.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await apiClient.put('/notifications/read-all');
      if (res.data.success) {
        showSuccess('All notifications marked as read.');
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      showError('Failed to mark all as read.');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'due_reminder':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'reservation_available':
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'fine_paid':
        return <Receipt className="w-5 h-5 text-sky-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            Notification Center
          </h1>
          <p className="text-xs text-slate-500">
            Automated alerts, return reminders, waitlist readiness notices, and payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterUnread
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filterUnread ? 'Showing Unread' : 'Show Unread Only'}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition ${
                  n.isRead ? 'bg-white hover:bg-slate-50/50' : 'bg-emerald-50/30 hover:bg-emerald-50/50'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm flex-shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                      {new Date(n.createdAt).toLocaleDateString()} ({new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  <div className="pt-1 flex items-center gap-3">
                    {n.link && (
                      <Link
                        to={n.link}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        View Details &rarr;
                      </Link>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No notifications to display</p>
            <p className="text-xs text-slate-400">You're completely caught up with all library updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
