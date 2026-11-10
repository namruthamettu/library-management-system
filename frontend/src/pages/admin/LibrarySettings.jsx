import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Settings, Save, Clock, Receipt, BookMarked, ShieldAlert } from 'lucide-react';

export default function LibrarySettings() {
  const [settings, setSettings] = useState({
    loanPeriodDays: 14,
    finePerDay: 5,
    maxBooksPerMember: 3,
    maxUnpaidFine: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/settings');
        if (res.data.success) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        showError('Failed to fetch library configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.put('/settings', settings);
      if (res.data.success) {
        showSuccess('System operational policies saved successfully!');
        setSettings(res.data.settings);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Global Library System Policies
        </h1>
        <p className="text-xs text-slate-500">
          Reconfigure universal borrowing periods, automated fine formulas, and account borrowing thresholds.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Loan Period Days */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-emerald-600" />
                Borrowing Period (Days)
              </div>
              <input
                type="number"
                name="loanPeriodDays"
                value={settings.loanPeriodDays}
                onChange={handleChange}
                min="1"
                max="90"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Standard days allowed for single book loan before overdue fines apply.
              </p>
            </div>

            {/* Fine Per Day */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Receipt className="w-4 h-4 text-rose-600" />
                Fine Rate Per Day (₹)
              </div>
              <input
                type="number"
                name="finePerDay"
                value={settings.finePerDay}
                onChange={handleChange}
                min="0"
                step="1"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Formula: Fine = Overdue Days × Fine Per Day (₹).
              </p>
            </div>

            {/* Max Books Per Member */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <BookMarked className="w-4 h-4 text-indigo-600" />
                Max Books Per Member
              </div>
              <input
                type="number"
                name="maxBooksPerMember"
                value={settings.maxBooksPerMember}
                onChange={handleChange}
                min="1"
                max="20"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Concurrent active loans allowed per student/faculty patron.
              </p>
            </div>

            {/* Max Unpaid Fine Limit */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Max Unpaid Fine Debt Threshold (₹)
              </div>
              <input
                type="number"
                name="maxUnpaidFine"
                value={settings.maxUnpaidFine}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Accumulated fine debt that blocks new book checkouts until cleared.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving System Policies...' : 'Save System Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
