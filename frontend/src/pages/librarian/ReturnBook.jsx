import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, Search, User, BookOpen, AlertTriangle, Receipt, Calendar } from 'lucide-react';

export default function ReturnBook() {
  const [activeLoans, setActiveLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [finePaid, setFinePaid] = useState(true);
  const [returning, setReturning] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transactions?status=active&limit=50');
      if (res.data.success) {
        setActiveLoans(res.data.transactions || []);
      }
    } catch (err) {
      showError('Failed to fetch active loans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const filteredLoans = activeLoans.filter((l) => {
    const q = searchTerm.toLowerCase();
    const titleMatch = l.book?.title?.toLowerCase().includes(q);
    const memberMatch = l.member?.name?.toLowerCase().includes(q);
    const memberIdMatch = l.member?.memberId?.toLowerCase().includes(q);
    const isbnMatch = l.book?.isbn?.toLowerCase().includes(q);
    return titleMatch || memberMatch || memberIdMatch || isbnMatch;
  });

  const handleReturnSubmit = async () => {
    if (!selectedLoan) return;
    setReturning(true);
    try {
      const res = await apiClient.put(`/transactions/${selectedLoan._id}/return`, {
        finePaid,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Book return recorded successfully!');
        setSelectedLoan(null);
        fetchActiveLoans();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to process return.');
    } finally {
      setReturning(false);
    }
  };

  // Fine Calculation Preview
  let overdueDays = 0;
  let fineAmount = 0;
  if (selectedLoan) {
    const now = new Date();
    const due = new Date(selectedLoan.dueDate);
    if (now > due) {
      overdueDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = selectedLoan.currentAccruedFine || overdueDays * 5;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-sky-600" />
          Circulation Desk: Return Book
        </h1>
        <p className="text-xs text-slate-500">
          Process returned books, assess overdue fees automatically, and advance the reservation queue.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Loans Search & List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search active loans by borrower, Member ID, book title, or ISBN..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          ) : filteredLoans.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredLoans.map((loan) => {
                const isSelected = selectedLoan?._id === loan._id;
                const isOverdue = new Date() > new Date(loan.dueDate);

                return (
                  <div
                    key={loan._id}
                    onClick={() => setSelectedLoan(loan)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-2 border-emerald-500 shadow-sm'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{loan.book?.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        Borrower: <strong>{loan.member?.name}</strong> ({loan.member?.memberId || 'N/A'})
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Due: {new Date(loan.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Within Due Date
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active loans found matching search criteria.
            </div>
          )}
        </div>

        {/* Right Column: Return Intake Panel (1 Col) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Return Inspection & Receipt
          </h3>

          {selectedLoan ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <p className="font-bold text-slate-900">{selectedLoan.book?.title}</p>
                <p className="text-slate-500">Borrower: {selectedLoan.member?.name}</p>
                <p className="text-slate-500 font-mono text-[11px]">Due: {new Date(selectedLoan.dueDate).toLocaleDateString()}</p>
              </div>

              {/* Overdue Calculation */}
              {overdueDays > 0 ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-rose-900 font-bold">
                    <span>Days Overdue:</span>
                    <span>{overdueDays} Day(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-900 font-extrabold text-sm border-t border-rose-200 pt-1">
                    <span>Assessed Fine:</span>
                    <span>₹{fineAmount}</span>
                  </div>

                  <label className="flex items-center gap-2 pt-2 cursor-pointer font-semibold text-rose-800">
                    <input
                      type="checkbox"
                      checked={finePaid}
                      onChange={(e) => setFinePaid(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    Mark Fine as Paid at Desk
                  </label>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Returned on time. Zero fine assessed.</span>
                </div>
              )}

              <button
                onClick={handleReturnSubmit}
                disabled={returning}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
              >
                {returning ? 'Processing Return...' : 'Confirm Book Return'}
              </button>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              Select an active loan from the list to inspect and process return.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
