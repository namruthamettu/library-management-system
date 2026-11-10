import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { Users, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight, UserCheck, ShieldAlert } from 'lucide-react';

export default function ManageMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [togglingId, setTogglingId] = useState(null);

  const { showSuccess, showError } = useToast();

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = { role: 'member', page, limit: 12 };
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get('/users', { params });
      if (res.data.success) {
        setMembers(res.data.users || []);
        setPagination({ total: res.data.total, pages: res.data.pages });
      }
    } catch (err) {
      showError('Failed to fetch members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleToggleStatus = async (user) => {
    setTogglingId(user._id);
    try {
      const res = await apiClient.put(`/users/${user._id}/status`, {
        isActive: !user.isActive,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Status updated successfully.');
        setMembers((prev) =>
          prev.map((m) => (m._id === user._id ? { ...m, isActive: !user.isActive } : m))
        );
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          Manage Library Members
        </h1>
        <p className="text-xs text-slate-500">
          Directory of registered student and faculty patrons, borrowing privileges, and account activations.
        </p>
      </div>

      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or Member ID..."
            className="w-full pl-10 pr-20 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : members.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Name & Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {m.memberId || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <p className="text-slate-400 text-[11px]">{m.email}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{m.phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            m.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          disabled={togglingId === m._id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            m.isActive
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {togglingId === m._id
                            ? 'Updating...'
                            : m.isActive
                            ? 'Deactivate'
                            : 'Activate'}
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
                  Showing Page {page} of {pagination.pages} ({pagination.total} Members)
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
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm">No members found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
