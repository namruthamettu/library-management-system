import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookMarked,
  History,
  Clock,
  Receipt,
  Bell,
  User,
  BookPlus,
  Layers,
  Users,
  Repeat,
  CheckCircle,
  AlertTriangle,
  FileBarChart,
  Settings,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Member Navigation items
  const memberLinks = [
    { name: 'Dashboard', path: '/member/dashboard', icon: LayoutDashboard },
    { name: 'My Borrowed Books', path: '/member/borrowed', icon: BookMarked },
    { name: 'Borrowing History', path: '/member/history', icon: History },
    { name: 'My Reservations', path: '/member/reservations', icon: Clock },
    { name: 'My Fines', path: '/member/fines', icon: Receipt },
    { name: 'Notifications', path: '/member/notifications', icon: Bell },
    { name: 'My Profile', path: '/member/profile', icon: User },
  ];

  // Librarian Navigation items
  const librarianLinks = [
    { name: 'Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard },
    { name: 'Issue Book', path: '/librarian/issue', icon: Repeat },
    { name: 'Return Book', path: '/librarian/return', icon: CheckCircle },
    { name: 'Manage Books', path: '/librarian/books', icon: BookOpen },
    { name: 'Add Book', path: '/librarian/books/add', icon: BookPlus },
    { name: 'Manage Categories', path: '/librarian/categories', icon: Layers },
    { name: 'Circulation History', path: '/librarian/transactions', icon: History },
    { name: 'Reservations Queue', path: '/librarian/reservations', icon: Clock },
    { name: 'Overdue Books', path: '/librarian/overdue', icon: AlertTriangle },
    { name: 'Manage Members', path: '/librarian/members', icon: Users },
    { name: 'Library Reports', path: '/librarian/reports', icon: FileBarChart },
    { name: 'My Profile', path: '/member/profile', icon: User },
  ];

  // Admin Navigation items
  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Librarians', path: '/admin/librarians', icon: ShieldCheck },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Library Settings', path: '/admin/settings', icon: Settings },
    { name: 'System Reports', path: '/admin/reports', icon: FileBarChart },
    { name: 'Manage Books', path: '/librarian/books', icon: BookOpen },
    { name: 'Issue / Return', path: '/librarian/issue', icon: Repeat },
    { name: 'My Profile', path: '/member/profile', icon: User },
  ];

  let currentLinks = memberLinks;
  if (role === 'librarian') currentLinks = librarianLinks;
  if (role === 'admin') currentLinks = adminLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 flex-shrink-0 border-r border-slate-800">
      <div>
        {/* User Card */}
        <div className="bg-slate-800/80 rounded-xl p-3.5 mb-6 border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-base border border-emerald-500/30">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
            <p className="text-[11px] font-semibold text-emerald-400 capitalize">
              {role === 'admin' ? 'System Administrator' : role === 'librarian' ? 'Circulation Staff' : 'Student / Faculty'}
            </p>
            {user.memberId && (
              <p className="text-[10px] text-slate-400 font-mono truncate">{user.memberId}</p>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {role === 'admin' ? 'Admin Navigation' : role === 'librarian' ? 'Staff Circulation' : 'Member Portal'}
        </div>

        <nav className="space-y-1">
          {currentLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.endsWith('/dashboard')}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Catalog Quick Jump */}
      <div className="pt-4 border-t border-slate-800 mt-6">
        <Link
          to="/catalogue"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700/80 hover:text-white transition border border-slate-700/50"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Public Book Catalogue
        </Link>
      </div>
    </aside>
  );
}
