import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import {
  ShieldCheck,
  Users,
  Settings,
  FileBarChart,
  BookOpen,
  Receipt,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCw,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggeringJobs, setTriggeringJobs] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/reports/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      showError('Failed to fetch admin metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTriggerJobs = async () => {
    setTriggeringJobs(true);
    try {
      const res = await apiClient.post('/notifications/trigger-jobs');
      if (res.data.success) {
        showSuccess('Scheduled due date & overdue jobs triggered successfully!');
        fetchStats();
      }
    } catch (err) {
      showError('Failed to trigger background jobs.');
    } finally {
      setTriggeringJobs(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Library Governance Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            High-level oversight of campus library staff, operational policies, and audit analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTriggerJobs}
            disabled={triggeringJobs}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            title="Manually trigger node-cron reminder scans"
          >
            <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${triggeringJobs ? 'animate-spin' : ''}`} />
            {triggeringJobs ? 'Running Scans...' : 'Run Scheduled Scans'}
          </button>
          <Link
            to="/admin/settings"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" /> System Policies
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Librarians"
          value={stats.totalLibrarians || 0}
          subtitle="Circulation staff accounts"
          icon={ShieldCheck}
          color="purple"
        />
        <StatCard
          title="Total Member Base"
          value={stats.totalMembers || 0}
          subtitle="Registered patrons"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Catalog Inventory"
          value={stats.totalBooks || 0}
          subtitle={`${stats.totalCopies || 0} Total physical copies`}
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Overdue Risk"
          value={stats.overdueBooks || 0}
          subtitle="Delinquent active loans"
          icon={AlertTriangle}
          color={stats.overdueBooks > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Fines Collected"
          value={`₹${stats.finesCollected || 0}`}
          subtitle="Settled revenue"
          icon={Receipt}
          color="emerald"
        />
        <StatCard
          title="Uncollected Fines"
          value={`₹${stats.pendingFines || 0}`}
          subtitle="Pending recovery"
          icon={Receipt}
          color="amber"
        />
        <StatCard
          title="Active Loans"
          value={stats.issuedBooks || 0}
          subtitle="Books on checkout"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Lifetime Loans"
          value={stats.totalTransactions || 0}
          subtitle="Archived transactions"
          icon={FileBarChart}
          color="emerald"
        />
      </div>

      {/* Admin Quick Jump Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/librarians"
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Manage Librarians</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Create, edit, activate/deactivate, and delete circulation staff accounts and assign administrative roles.
          </p>
        </Link>

        <Link
          to="/admin/settings"
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Library Policy Settings</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure global loan period days, fine per day, maximum books per member, and unpaid fine thresholds.
          </p>
        </Link>

        <Link
          to="/admin/reports"
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <FileBarChart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Institutional Reports & Audits</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate and export CSV/PDF reports for inventory audit, overdue risk tracking, and fine revenue statements.
          </p>
        </Link>
      </div>
    </div>
  );
}
