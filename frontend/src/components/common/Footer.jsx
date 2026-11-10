import React from 'react';
import { Link } from 'react-router-dom';
import { Library, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Library className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight">Central Library</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering academic excellence, research, and collaborative knowledge discovery through centralized digital cataloging and automated circulation.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition">Library Home</Link>
              </li>
              <li>
                <Link to="/catalogue" className="hover:text-emerald-400 transition">Book Catalogue</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition">Member Login</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition">Student Registration</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Circulation Hours */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Library Hours</h4>
            <div className="text-xs space-y-1.5 text-slate-400">
              <p><strong className="text-slate-300">Mon - Fri:</strong> 08:00 AM – 09:00 PM</p>
              <p><strong className="text-slate-300">Saturday:</strong> 09:00 AM – 06:00 PM</p>
              <p><strong className="text-slate-300">Sunday:</strong> 10:00 AM – 04:00 PM</p>
              <p className="text-[11px] text-emerald-400 pt-1">Reading hall open 24/7 during exams.</p>
            </div>
          </div>

          {/* Col 4: Campus Helpdesk */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Contact Desk</h4>
            <div className="text-xs space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Academic Block A, Ground Floor, Central Campus</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>library-desk@college.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>+91 (080) 2345-6789</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Central College Library. All Rights Reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Academic Innovation
          </p>
        </div>
      </div>
    </footer>
  );
}
