import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle, User, BookOpen, Receipt, CheckCircle, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OverdueBooks() {
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/overdue-books?format=json');
      if (res.data.success) {
        setOverdueLoans(res.data.data || []);
      }
    } catch (err) {
      showError('Failed to fetch overdue books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const totalOverdueFine = overdueLoans.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            Overdue Loans Monitor
          </h1>
          <p className="text-xs text-slate-500">
            List of active loans that have exceeded their scheduled borrowing due dates.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl flex items-center gap-3">
          <span className="text-xs font-bold text-rose-900">Total Accrued Fines:</span>
          <span className="text-base font-extrabold text-rose-600">₹{totalOverdueFine}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : overdueLoans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Member ID</th>
                  <th className="py-3 px-4">Scheduled Due Date</th>
                  <th className="py-3 px-4 text-center">Days Late</th>
                  <th className="py-3 px-4 text-center">Current Fine</th>
                  <th className="py-3 px-4 text-right">Circulation Desk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoans.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{item.memberName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{item.memberId}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        {item.overdueDays} Day(s) Late
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-rose-600">
                      ₹{item.fineAmount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/librarian/return"
                        className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg border border-sky-200 transition"
                      >
                        Accept Return &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No overdue loans!</p>
            <p className="text-xs text-slate-400">All borrowed books are currently within their due date windows.</p>
          </div>
        )}
      </div>
    </div>
  );
}
