import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Edit, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';

export default function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    publishedYear: '',
    totalCopies: 0,
    availableCopies: 0,
    shelfLocation: '',
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [originalTotal, setOriginalTotal] = useState(0);
  const [originalAvailable, setOriginalAvailable] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, bookRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get(`/books/${id}`),
        ]);

        if (catsRes.data.success) {
          setCategories(catsRes.data.categories || []);
        }

        if (bookRes.data.success) {
          const b = bookRes.data.book;
          setFormData({
            title: b.title,
            author: b.author,
            isbn: b.isbn,
            category: typeof b.category === 'object' ? b.category._id : b.category,
            publisher: b.publisher,
            publishedYear: b.publishedYear,
            totalCopies: b.totalCopies,
            availableCopies: b.availableCopies,
            shelfLocation: b.shelfLocation,
          });
          setOriginalTotal(b.totalCopies);
          setOriginalAvailable(b.availableCopies);
          if (b.coverImage) setCoverPreview(b.coverImage);
        }
      } catch (err) {
        showError('Failed to load book data for editing.');
        navigate('/librarian/books');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const currentlyIssued = originalTotal - originalAvailable;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseInt(formData.totalCopies, 10) < currentlyIssued) {
      showError(`Cannot reduce total copies below ${currentlyIssued} (copies currently issued to members).`);
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (coverFile) {
        data.append('coverImage', coverFile);
      }

      const res = await apiClient.put(`/books/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Book updated successfully!');
        navigate('/librarian/books');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update book.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-96 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/librarian/books"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Book Management
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Edit className="w-6 h-6 text-emerald-600" />
            Edit Book Information
          </h1>
          <p className="text-xs text-slate-500">
            Modify publication metadata, shelf location, or adjust total physical inventory.
          </p>
        </div>

        {currentlyIssued > 0 && (
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-2 text-xs text-sky-900">
            <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              <strong>Circulation Notice:</strong> There are currently <strong>{currentlyIssued}</strong> copies on active loan. Total copies cannot be reduced below this number.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Book Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Author & ISBN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Author *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ISBN Number *
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Category & Publisher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Publisher *
              </label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Published Year, Total Copies, Shelf Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Published Year *
              </label>
              <input
                type="number"
                name="publishedYear"
                value={formData.publishedYear}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Total Copies *
              </label>
              <input
                type="number"
                name="totalCopies"
                value={formData.totalCopies}
                onChange={handleChange}
                min={currentlyIssued}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Shelf Location *
              </label>
              <input
                type="text"
                name="shelfLocation"
                value={formData.shelfLocation}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Change Book Cover Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center flex-shrink-0">
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave unchanged to preserve existing book cover.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              to="/librarian/books"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              {submitting ? 'Saving Updates...' : 'Update Book Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
