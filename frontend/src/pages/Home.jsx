import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Library,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import BookCard from '../components/common/BookCard';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, booksRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/books?limit=8&sortBy=newest'),
        ]);

        if (catsRes.data.success) {
          setCategories(catsRes.data.categories || []);
        }
        if (booksRes.data.success) {
          setFeaturedBooks(booksRes.data.books || []);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/catalogue');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Central Digital Academic Library Portal
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Discover, Borrow & Innovate with <span className="text-emerald-400">Next-Gen Knowledge</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Instant online access to university texts, engineering references, research journals, automated loan tracking, and reservation queues.
          </p>

          {/* Catalog Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-slate-700/50"
          >
            <div className="pl-4 pr-2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, author, ISBN, or subject..."
              className="flex-1 py-3 px-2 text-slate-900 text-sm focus:outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Category Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Popular Categories:</span>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat._id}
                to={`/catalogue?category=${cat._id}`}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/80 text-center">
            <div className="text-3xl font-extrabold text-slate-900">15,000+</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Printed Volumes</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/80 text-center">
            <div className="text-3xl font-extrabold text-emerald-600">100%</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Digital Cataloging</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/80 text-center">
            <div className="text-3xl font-extrabold text-slate-900">48h</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Reserved Pickup Window</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200/80 text-center">
            <div className="text-3xl font-extrabold text-emerald-600">24/7</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Online Self-Service</div>
          </div>
        </div>
      </section>

      {/* Featured New Books Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Recent Arrivals
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Latest Additions to Circulation
            </h2>
          </div>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition"
          >
            Explore Complete Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-slate-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : featuredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">No books in catalog yet. Please check back soon.</p>
          </div>
        )}
      </section>

      {/* Institutional Highlights */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Academic Circulation Policy</h3>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Designed for Students & Faculty</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Seamless Issuing & Renewals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Borrow up to your configured institutional limit with transparent loan windows. Eligible titles can be renewed online in one click.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">FIFO Reservation Queue</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When popular titles are checked out, join the automated first-come, first-served queue and receive alerts when copies are held for you.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Smart Reminders & Due Dates</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stay updated with automated 48-hour return reminders and transparent overdue fine schedules to maintain good borrowing standing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
