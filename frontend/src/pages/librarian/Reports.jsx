import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { FileBarChart, Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('most-borrowed');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState(null);
  const { showSuccess, showError } = useToast();

  const reportTabs = [
    { id: 'most-borrowed', label: 'Most Borrowed Books' },
    { id: 'overdue-books', label: 'Overdue Books' },
    { id: 'member-history', label: 'Member Borrowing History' },
    { id: 'monthly-issues', label: 'Monthly Issue Count' },
    { id: 'stock-report', label: 'Available Stock Reports' },
    { id: 'fine-collections', label: 'Fine Collections' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/reports/${reportType}?format=json`);
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      showError('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  // Handle Export (CSV or PDF)
  const handleExport = async (format) => {
    setExportingFormat(format);
    try {
      const response = await apiClient.get(`/reports/${reportType}?format=${format}`, {
        responseType: 'blob',
      });

      // Create download anchor
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `library-report-${reportType}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`${format.toUpperCase()} report generated and downloaded successfully!`);
    } catch (err) {
      showError(`Failed to export ${format.toUpperCase()} report.`);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-emerald-600" />
            Library Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Generate circulation statements, overdue audits, and export formatted PDF or CSV documents.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleExport('csv')}
            disabled={exportingFormat !== null || loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            {exportingFormat === 'csv' ? 'Generating CSV...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportingFormat !== null || loading}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {exportingFormat === 'pdf' ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              reportType === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Highlights */}
      {reportData?.summaryNotes && reportData.summaryNotes.length > 0 && (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-wrap gap-4 text-xs">
          {reportData.summaryNotes.map((note, idx) => (
            <div key={idx} className="font-semibold text-emerald-900">
              • {note}
            </div>
          ))}
        </div>
      )}

      {/* Report Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            {reportData?.title || 'Report Statement'}
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {reportData?.count || 0} Total Records
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : reportData?.data && reportData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  {reportData.columns.map((col, idx) => (
                    <th key={idx} className="py-3 px-4">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60">
                    {reportData.columns.map((col, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-slate-700">
                        {row[col.key] instanceof Date
                          ? new Date(row[col.key]).toLocaleDateString()
                          : String(row[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileBarChart className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm">No records available for this report type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
