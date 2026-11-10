import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MapPin, CheckCircle, Clock } from 'lucide-react';

export default function BookCard({ book, onReserve }) {
  const isAvailable = book.availableCopies > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between group">
      <div>
        {/* Book Cover Image */}
        <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}

          <div
            className={`w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-slate-300 p-4 text-center ${
              book.coverImage ? 'hidden' : 'flex'
            }`}
          >
            <BookOpen className="w-12 h-12 text-emerald-400 mb-2 opacity-80" />
            <span className="text-xs font-semibold line-clamp-2 text-white">{book.title}</span>
          </div>

          {/* Availability Badge Overlay */}
          <div className="absolute top-3 right-3">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 backdrop-blur-md text-white shadow-sm">
                <CheckCircle className="w-3 h-3" />
                {book.availableCopies} Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/90 backdrop-blur-md text-white shadow-sm">
                <Clock className="w-3 h-3" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Category Tag Overlay */}
          {book.category && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-slate-200 uppercase tracking-wider">
                {typeof book.category === 'object' ? book.category.name : 'General'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-1.5">
          <Link
            to={`/catalogue/${book._id}`}
            className="block font-bold text-slate-900 text-sm hover:text-emerald-600 transition line-clamp-1"
            title={book.title}
          >
            {book.title}
          </Link>
          <p className="text-xs text-slate-500 font-medium line-clamp-1">by {book.author}</p>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
            <span className="font-mono text-[10px] text-slate-400">ISBN: {book.isbn}</span>
            <div className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-[140px]">
              <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{book.shelfLocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <Link
          to={`/catalogue/${book._id}`}
          className="flex-1 text-center py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          View Details
        </Link>

        {!isAvailable && onReserve && (
          <button
            onClick={() => onReserve(book)}
            className="py-2 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition"
          >
            Reserve
          </button>
        )}
      </div>
    </div>
  );
}
