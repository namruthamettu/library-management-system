import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookCard from '../components/common/BookCard';
import Modal from '../components/common/Modal';
import {
  Search,
  Filter,
  SlidersHorizontal,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function BookCatalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });

  // Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('availableOnly') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Reservation Modal state
  const [selectedBookForReservation, setSelectedBookForReservation] = useState(null);
  const [reserveLoading, setReserveLoading] = useState(false);

  // Load Categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Books based on filters
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sortBy,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (availableOnly) params.availableOnly = 'true';

      const res = await apiClient.get('/books', { params });
      if (res.data.success) {
        setBooks(res.data.books || []);
        setPagination({
          total: res.data.total,
          pages: res.data.pages,
          currentPage: res.data.currentPage,
        });
      }
    } catch (err) {
      showError('Failed to load books. Please check network connection.');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, searchTerm, selectedCategory, availableOnly, showError]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  // Handle Category Click
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  // Open Reservation Modal
  const handleOpenReserve = (book) => {
    if (!isAuthenticated) {
      showInfo('Please log in as a student or faculty member to place book reservations.');
      navigate('/login');
      return;
    }
    if (user.role !== 'member') {
      showError('Only members can place book reservations.');
      return;
    }
    setSelectedBookForReservation(book);
  };

  // Confirm Reservation
  const handleConfirmReservation = async () => {
    if (!selectedBookForReservation) return;
    setReserveLoading(true);
    try {
      const res = await apiClient.post('/reservations', {
        bookId: selectedBookForReservation._id,
      });
      if (res.data.success) {
        showSuccess(res.data.message || 'Book reserved successfully!');
        setSelectedBookForReservation(null);
        fetchBooks();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place reservation.';
      showError(msg);
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">University Book Catalogue</h1>
          <p className="text-sm text-slate-500">
            Browse our comprehensive academic repository of course textbooks, monographs, and research volumes.
          </p>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Search
            </button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Availability Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => {
                  setAvailableOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              Available Only
            </label>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="title_asc">Sort: Title (A - Z)</option>
              <option value="title_desc">Sort: Title (Z - A)</option>
              <option value="year_desc">Sort: Publication Year (Latest)</option>
              <option value="availability">Sort: Available Copies</option>
            </select>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Genres
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryChange(cat._id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                selectedCategory === cat._id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name} ({cat.bookCount || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book._id} book={book} onReserve={handleOpenReserve} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No books match your search filters</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search terms, selecting "All Genres", or unchecking the "Available Only" filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setAvailableOnly(false);
              setSortBy('newest');
              setPage(1);
            }}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Showing Page <strong className="text-slate-800">{pagination.currentPage}</strong> of{' '}
            <strong className="text-slate-800">{pagination.pages}</strong> ({pagination.total} Total Books)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.currentPage <= 1}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2">{pagination.currentPage}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.currentPage >= pagination.pages}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Book Reservation Confirmation Modal */}
      <Modal
        isOpen={!!selectedBookForReservation}
        onClose={() => setSelectedBookForReservation(null)}
        title="Confirm Book Reservation"
      >
        {selectedBookForReservation && (
          <div className="space-y-4">
            <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-16 h-20 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {selectedBookForReservation.coverImage ? (
                  <img
                    src={selectedBookForReservation.coverImage}
                    alt={selectedBookForReservation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedBookForReservation.title}
                </h4>
                <p className="text-xs text-slate-500">by {selectedBookForReservation.author}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-1">ISBN: {selectedBookForReservation.isbn}</p>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  0 of {selectedBookForReservation.totalCopies} copies available on shelf
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1.5 leading-relaxed">
              <p className="font-bold">Reservation Policy:</p>
              <p>• You will be added to the First-Come, First-Served (FIFO) waitlist.</p>
              <p>• When an active loan is returned, you will receive an in-app and email alert.</p>
              <p>• The book will be held at the circulation desk for <strong>48 hours</strong> before expiring.</p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSelectedBookForReservation(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reserveLoading}
                onClick={handleConfirmReservation}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
              >
                {reserveLoading ? 'Placing Reservation...' : 'Confirm Reservation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
