import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Receipt, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import StatCard from '../../components/common/StatCard';

export default function MyFines() {
  const [finesData, setFinesData] = useState({ totalPaid: 0, totalPending: 0, fines: [] });
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchFines = async () => {
      try {
        const res = await apiClient.get('/transactions/fines/my');
        if (res.data.success) {
          setFinesData(res.data);
        }
      } catch (err) {
        showError('Failed to load fines summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchFines();
  }, [showError]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-emerald-600" />
          My Library Fines & Dues
        </h1>
        <p className="text-xs text-slate-500">
          Account of overdue fines assessed on delayed book returns and payments recorded at the circulation desk.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Outstanding Pending Dues"
          value={`₹${finesData.totalPending}`}
          subtitle="Must be cleared at library desk"
          icon={AlertTriangle}
          color={finesData.totalPending > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Total Settled / Paid Fines"
          value={`₹${finesData.totalPaid}`}
          subtitle="All historical payments"
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Policy Banner */}
      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200/80 flex items-start gap-3 text-xs text-sky-900">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">How to Clear Library Dues:</strong> Outstanding overdue fines can be settled directly in cash or UPI at the central library circulation counter. Once processed by a librarian, your balance will automatically update.
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Fine Ledger Breakdown
        </div>

        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : finesData.fines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Fine Amount</th>
                  <th className="py-3 px-4 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finesData.fines.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {f.book?.title || 'Unknown Title'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(f.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {f.returnDate ? new Date(f.returnDate).toLocaleDateString() : 'Not Yet Returned'}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      ₹{f.fineAmount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          f.finePaid
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {f.finePaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Clean Borrowing Record</p>
            <p className="text-xs text-slate-400">You have no overdue fines on your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
