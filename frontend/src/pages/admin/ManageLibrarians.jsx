import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Plus, Edit, Trash2, Mail, Phone, Lock, User } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function ManageLibrarians() {
  const [librarians, setLibrarians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLibrarian, setEditingLibrarian] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchLibrarians = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users?role=librarian&limit=50');
      if (res.data.success) {
        setLibrarians(res.data.users || []);
      }
    } catch (err) {
      showError('Failed to fetch librarian accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarians();
  }, []);

  const handleOpenAdd = () => {
    setEditingLibrarian(null);
    setFormData({ name: '', email: '', password: '', phone: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lib) => {
    setEditingLibrarian(lib);
    setFormData({ name: lib.name, email: lib.email, password: '', phone: lib.phone || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLibrarian) {
        const payload = { name: formData.name, phone: formData.phone };
        if (formData.password) payload.password = formData.password;

        const res = await apiClient.put(`/users/librarian/${editingLibrarian._id}`, payload);
        if (res.data.success) {
          showSuccess('Librarian account updated successfully.');
          setIsModalOpen(false);
          fetchLibrarians();
        }
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          showError('Name, email, and password are required.');
          setSubmitting(false);
          return;
        }

        const res = await apiClient.post('/users/librarian', formData);
        if (res.data.success) {
          showSuccess(res.data.message || 'Librarian account created.');
          setIsModalOpen(false);
          fetchLibrarians();
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (lib) => {
    try {
      const res = await apiClient.put(`/users/${lib._id}/status`, {
        isActive: !lib.isActive,
      });
      if (res.data.success) {
        showSuccess(res.data.message || 'Status updated.');
        setLibrarians((prev) =>
          prev.map((item) => (item._id === lib._id ? { ...item, isActive: !lib.isActive } : item))
        );
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/users/librarian/${deleteModalItem._id}`);
      if (res.data.success) {
        showSuccess(res.data.message || 'Librarian account removed.');
        setDeleteModalItem(null);
        fetchLibrarians();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete librarian.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            Manage Librarian Staff Accounts
          </h1>
          <p className="text-xs text-slate-500">
            Create, update credentials, activate/deactivate, and manage circulation desk staff.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Librarian
        </button>
      </div>

      {/* Librarians Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : librarians.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Name & Email</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {librarians.map((lib) => (
                  <tr key={lib._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{lib.name}</p>
                      <p className="text-slate-400 text-[11px]">{lib.email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-semibold">{lib.memberId || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{lib.phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(lib.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          lib.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {lib.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleToggleStatus(lib)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                          lib.isActive
                            ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {lib.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(lib)}
                        className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Edit Librarian"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteModalItem(lib)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Librarian"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No librarian accounts registered</p>
            <p className="text-xs text-slate-400">Click "Add Librarian" above to provision the first staff account.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLibrarian ? 'Update Librarian Account' : 'Provision New Librarian'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Staff Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Robert Smith"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          {!editingLibrarian && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Staff Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="librarian@college.edu"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {editingLibrarian ? 'New Password (Optional)' : 'Initial Password *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingLibrarian ? 'Leave blank to preserve' : 'Min 6 characters'}
              required={!editingLibrarian}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingLibrarian ? 'Save Updates' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalItem}
        onClose={() => setDeleteModalItem(null)}
        title="Confirm Librarian Deletion"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to delete librarian account for <strong>'{deleteModalItem?.name}'</strong> ({deleteModalItem?.email})?
          </p>
          <p className="text-slate-500">
            This action will revoke their circulation desk login and staff permissions immediately.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteModalItem(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
