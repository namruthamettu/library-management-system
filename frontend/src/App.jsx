import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import BookCatalogue from './pages/BookCatalogue';
import BookDetails from './pages/BookDetails';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Member Pages
import MemberDashboard from './pages/member/MemberDashboard';
import MyBorrowedBooks from './pages/member/MyBorrowedBooks';
import BorrowingHistory from './pages/member/BorrowingHistory';
import MyReservations from './pages/member/MyReservations';
import MyFines from './pages/member/MyFines';
import Notifications from './pages/member/Notifications';
import MyProfile from './pages/member/MyProfile';

// Librarian Pages
import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import ManageBooks from './pages/librarian/ManageBooks';
import AddBook from './pages/librarian/AddBook';
import EditBook from './pages/librarian/EditBook';
import ManageCategories from './pages/librarian/ManageCategories';
import ManageMembers from './pages/librarian/ManageMembers';
import IssueBook from './pages/librarian/IssueBook';
import ReturnBook from './pages/librarian/ReturnBook';
import Transactions from './pages/librarian/Transactions';
import Reservations from './pages/librarian/Reservations';
import OverdueBooks from './pages/librarian/OverdueBooks';
import Reports from './pages/librarian/Reports';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageLibrarians from './pages/admin/ManageLibrarians';
import LibrarySettings from './pages/admin/LibrarySettings';
import UserManagement from './pages/admin/UserManagement';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/catalogue" element={<BookCatalogue />} />
              <Route path="/catalogue/:id" element={<BookDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Member Protected Routes */}
            <Route
              path="/member"
              element={
                <ProtectedRoute allowedRoles={['member', 'librarian', 'admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<MemberDashboard />} />
              <Route path="borrowed" element={<MyBorrowedBooks />} />
              <Route path="history" element={<BorrowingHistory />} />
              <Route path="reservations" element={<MyReservations />} />
              <Route path="fines" element={<MyFines />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<MyProfile />} />
            </Route>

            {/* Librarian Protected Routes */}
            <Route
              path="/librarian"
              element={
                <ProtectedRoute allowedRoles={['librarian', 'admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<LibrarianDashboard />} />
              <Route path="books" element={<ManageBooks />} />
              <Route path="books/add" element={<AddBook />} />
              <Route path="books/edit/:id" element={<EditBook />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="members" element={<ManageMembers />} />
              <Route path="issue" element={<IssueBook />} />
              <Route path="return" element={<ReturnBook />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="overdue" element={<OverdueBooks />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="librarians" element={<ManageLibrarians />} />
              <Route path="settings" element={<LibrarySettings />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<UserManagement />} />
            </Route>

            {/* Catch-all Not Found Route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4">
                  <div className="text-center space-y-3">
                    <h1 className="text-6xl font-extrabold text-emerald-600">404</h1>
                    <h2 className="text-xl font-bold">Page Not Found</h2>
                    <p className="text-xs text-slate-500">The requested library route does not exist.</p>
                    <a
                      href="/"
                      className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      Return to Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
