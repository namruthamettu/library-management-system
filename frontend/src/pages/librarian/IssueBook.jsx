import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Repeat, Search, User, BookOpen, AlertCircle, CheckCircle2, Calendar, MapPin } from 'lucide-react';

export default function IssueBook() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchingMember, setSearchingMember] = useState(false);

  const [bookQuery, setBookQuery] = useState(searchParams.get('bookId') || '');
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchingBook, setSearchingBook] = useState(false);

  const [settings, setSettings] = useState(null);
  const [issuing, setIssuing] = useState(false);

  // Fetch library settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/settings');
        if (res.data.success) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();

    // If initial bookId provided in URL params
    const initialBookId = searchParams.get('bookId');
    if (initialBookId) {
      apiClient.get(`/books/${initialBookId}`).then((res) => {
        if (res.data.success) setSelectedBook(res.data.book);
      });
    }
  }, [searchParams]);

  // Search Member
  const handleSearchMember = async (e) => {
    e?.preventDefault();
    if (!memberQuery.trim()) return;
    setSearchingMember(true);
    try {
      const res = await apiClient.get(`/users?role=member&search=${encodeURIComponent(memberQuery.trim())}`);
      if (res.data.success && res.data.users.length > 0) {
        setSelectedMember(res.data.users[0]);
      } else {
        showError('No member found with that name, email, or Member ID.');
        setSelectedMember(null);
      }
    } catch (err) {
      showError('Failed to search members.');
    } finally {
      setSearchingMember(false);
    }
  };

  // Search Book
  const handleSearchBook = async (e) => {
    e?.preventDefault();
    if (!bookQuery.trim()) return;
    setSearchingBook(true);
    try {
      const res = await apiClient.get(`/books?search=${encodeURIComponent(bookQuery.trim())}`);
      if (res.data.success && res.data.books.length > 0) {
        setSelectedBook(res.data.books[0]);
      } else {
        showError('No book found matching that title or ISBN.');
        setSelectedBook(null);
      }
    } catch (err) {
      showError('Failed to search book catalog.');
    } finally {
      setSearchingBook(false);
    }
  };

  // Issue Book Submission
  const handleIssue = async () => {
    if (!selectedMember || !selectedBook) {
      showError('Please verify and select both a member and an available book.');
      return;
    }

    setIssuing(true);
    try {
      const res = await apiClient.post('/transactions/issue', {
        memberId: selectedMember._id,
        bookId: selectedBook._id,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Book issued successfully!');
        setSelectedMember(null);
        setSelectedBook(null);
        setMemberQuery('');
        setBookQuery('');
        navigate('/librarian/transactions');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to issue book.');
    } finally {
      setIssuing(false);
    }
  };

  // Computed Due Date Preview
  const loanDays = settings?.loanPeriodDays || 14;
  const calculatedDueDate = new Date();
  calculatedDueDate.setDate(calculatedDueDate.getDate() + loanDays);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Repeat className="w-6 h-6 text-emerald-600" />
          Circulation Desk: Issue Book
        </h1>
        <p className="text-xs text-slate-500">
          Search for an active member and an available catalog book to generate a borrowing loan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Member Selection */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-emerald-600" />
            Step 1: Identify Member
          </div>

          <form onSubmit={handleSearchMember} className="relative">
            <input
              type="text"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Enter Member ID (e.g. MEM-10001) or Email..."
              className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={searchingMember}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {searchingMember ? 'Finding...' : 'Find'}
            </button>
          </form>

          {selectedMember ? (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedMember.name}</h4>
                  <p className="text-slate-500">{selectedMember.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedMember.isActive ? 'Active Member' : 'Deactivated'}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-100 flex justify-between text-[11px] text-slate-600">
                <span>Member ID: <strong className="font-mono">{selectedMember.memberId || 'N/A'}</strong></span>
                <span>Phone: {selectedMember.phone || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No member selected. Search using Member ID or name above.
            </div>
          )}
        </div>

        {/* Step 2: Book Selection */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Step 2: Select Book
          </div>

          <form onSubmit={handleSearchBook} className="relative">
            <input
              type="text"
              value={bookQuery}
              onChange={(e) => setBookQuery(e.target.value)}
              placeholder="Enter Title or ISBN..."
              className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={searchingBook}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {searchingBook ? 'Finding...' : 'Find'}
            </button>
          </form>

          {selectedBook ? (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{selectedBook.title}</h4>
                  <p className="text-slate-500">by {selectedBook.author}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedBook.availableCopies > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedBook.availableCopies > 0
                    ? `${selectedBook.availableCopies} Copies Avail`
                    : 'Out of Stock'}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-100 flex justify-between text-[11px] text-slate-600">
                <span className="font-mono">ISBN: {selectedBook.isbn}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" /> {selectedBook.shelfLocation}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No book selected. Search by title or ISBN above.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation & Issue Summary Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-xs">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Calculated Due Date: <span className="text-emerald-700">{calculatedDueDate.toLocaleDateString()}</span>
          </p>
          <p className="text-slate-500 text-[11px]">
            Based on active library policy of <strong>{loanDays} loan days</strong>.
          </p>
        </div>

        <button
          onClick={handleIssue}
          disabled={!selectedMember || !selectedBook || issuing || (selectedBook && selectedBook.availableCopies <= 0)}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {issuing ? 'Recording Transaction...' : 'Confirm & Issue Book'}
        </button>
      </div>
    </div>
  );
}
