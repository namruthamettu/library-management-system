import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  BookOpen,
  ArrowLeft,
  MapPin,
  Calendar,
  Layers,
  Building,
  Hash,
  CheckCircle2,
  Clock,
  Shield,
  Edit,
  Repeat,
} from 'lucide-react';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await apiClient.get(`/books/${id}`);
        if (res.data.success) {
          setBook(res.data.book);
        }
      } catch (err) {
        showError('Book not found or unable to fetch details.');
        navigate('/catalogue');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, navigate, showError]);

  const handleReserve = async () => {
    if (!isAuthenticated) {
      showInfo('Please sign in to place reservations.');
      navigate('/login');
      return;
    }
    if (user.role !== 'member') {
      showError('Only members can place book reservations.');
      return;
    }

    setReserving(true);
    try {
      const res = await apiClient.post('/reservations', { bookId: book._id });
      if (res.data.success) {
        showSuccess(res.data.message || 'Book reserved successfully!');
        // Refresh details
        const refreshed = await apiClient.get(`/books/${id}`);
        if (refreshed.data.success) setBook(refreshed.data.book);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to place reservation.');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="aspect-[3/4] bg-slate-200 rounded-2xl"></div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  const isAvailable = book.availableCopies > 0;
  const availabilityPercent = Math.round((book.availableCopies / book.totalCopies) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/catalogue"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Book Catalogue
      </Link>

      {/* Main Details Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Cover Column */}
          <div className="space-y-4">
            <div className="aspect-[3/4] w-full rounded-2xl bg-slate-100 overflow-hidden shadow-md flex items-center justify-center border border-slate-200">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-300 ${
                  book.coverImage ? 'hidden' : 'flex'
                }`}
              >
                <BookOpen className="w-16 h-16 text-emerald-400 mb-2" />
                <span className="font-bold text-white text-sm">{book.title}</span>
              </div>
            </div>

            {/* Shelf Location Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physical Shelf Location</p>
                <p className="text-xs font-bold text-slate-800">{book.shelfLocation}</p>
              </div>
            </div>
          </div>

          {/* Info Details Column */}
          <div className="md:col-span-2 space-y-6">
            <div>
              {book.category && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-2">
                  {book.category.name}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {book.title}
              </h1>
              <p className="text-base text-slate-600 font-medium mt-1">Written by <strong className="text-slate-900">{book.author}</strong></p>
            </div>

            {/* Inventory Status Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider">Circulation Availability</span>
                {isAvailable ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {book.availableCopies} Copies Available On Shelf
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-rose-500" />
                    All {book.totalCopies} Copies Checked Out
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${availabilityPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Total Catalog Inventory: {book.totalCopies} copies</span>
                <span>Active Reservations Waiting: {book.activeReservationsCount || 0}</span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> ISBN Number
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm">{book.isbn}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> Publisher
                </span>
                <span className="font-semibold text-slate-800 truncate block">{book.publisher}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Published Year
                </span>
                <span className="font-semibold text-slate-800">{book.publishedYear}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Category Genre
                </span>
                <span className="font-semibold text-slate-800 truncate block">
                  {book.category?.name || 'General'}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              {/* Member Reserve Action */}
              {!isAvailable ? (
                <button
                  onClick={handleReserve}
                  disabled={reserving}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {reserving ? 'Joining Queue...' : 'Reserve This Book (FIFO Queue)'}
                </button>
              ) : (
                <div className="text-xs text-slate-500 bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200/80 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    This book is available on the shelf. Visit the circulation counter with your Member ID to borrow it immediately.
                  </span>
                </div>
              )}

              {/* Staff Quick Actions */}
              {isAuthenticated && (user.role === 'admin' || user.role === 'librarian') && (
                <>
                  <Link
                    to={`/librarian/issue?bookId=${book._id}`}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center gap-1.5"
                  >
                    <Repeat className="w-4 h-4" />
                    Issue to Member
                  </Link>
                  <Link
                    to={`/librarian/books/edit/${book._id}`}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Book Info
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
