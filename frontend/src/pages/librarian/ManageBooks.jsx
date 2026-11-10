import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { BookOpen, BookPlus, Search, Edit, Trash2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Delete Confirmation Modal State
  const [deleteModalBook, setDeleteModalBook] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data.success) setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;

      const res = await apiClient.get('/books', { params });
      if (res.data.success) {
        setBooks(res.data.books || []);
        setPagination({ total: res.data.total, pages: res.data.pages });
      }
    } catch (err) {
      showError('Failed to fetch book catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalBook) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/books/${deleteModalBook._id}`);
      if (res.data.success) {
        showSuccess(res.data.message || 'Book deleted successfully.');
        setDeleteModalBook(null);
        fetchBooks();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Cannot delete book.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Manage Library Books
          </h1>
          <p className="text-xs text-slate-500">
            Catalog inventory repository: add new titles, update shelf locations, and manage copies.
          </p>
        </div>

        <Link
          to="/librarian/books/add"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <BookPlus className="w-4 h-4" /> Add New Book
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            className="w-full pl-10 pr-20 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Book Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Book Title & Author</th>
                    <th className="py-3 px-4">ISBN</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Shelf Location</th>
                    <th className="py-3 px-4 text-center">Copies (Avail / Total)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {books.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <Link
                          to={`/catalogue/${b._id}`}
                          className="font-bold text-slate-900 hover:text-emerald-600 transition block truncate max-w-xs"
                        >
                          {b.title}
                        </Link>
                        <span className="text-[11px] text-slate-400">{b.author}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{b.isbn}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {typeof b.category === 'object' ? b.category?.name : 'General'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{b.shelfLocation}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={b.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {b.availableCopies}
                        </span>{' '}
                        / {b.totalCopies}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          to={`/librarian/books/edit/${b._id}`}
                          className="inline-block p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Edit Book"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModalBook(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Book"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing Page {page} of {pagination.pages} ({pagination.total} Titles)
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
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm">No books in catalog.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalBook}
        onClose={() => setDeleteModalBook(null)}
        title="Confirm Book Deletion"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to permanently delete <strong>'{deleteModalBook?.title}'</strong> (ISBN: {deleteModalBook?.isbn}) from the library catalog?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
            <strong>System Safeguard:</strong> The system will reject deletion if any copies of this book are currently on loan or overdue.
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteModalBook(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Book'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
