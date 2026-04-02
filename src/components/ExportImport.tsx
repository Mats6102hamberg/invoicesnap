import { useState } from 'react';

interface ExportImportProps {
  onClose: () => void;
}

const STORAGE_KEYS = [
  'is_receipts_v1',
  'is_recurring_v1',
  'is_time_tracking_v1',
  'is_install_dismissed',
  'is_company_profile_v1',
  'is_invoices_v1',
  'is_onboarding_done',
];

export default function ExportImport({ onClose }: ExportImportProps) {
  const [message, setMessage] = useState('');

  const handleExport = () => {
    const data: Record<string, any> = {};
    STORAGE_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) {
        try { data[key] = JSON.parse(val); } catch { data[key] = val; }
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `invoicesnap-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Data exported successfully!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        Object.entries(data).forEach(([key, value]) => {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        });

        setMessage('Data imported successfully! Page will reload...');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setMessage('Error: invalid file');
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (!confirm('This will delete ALL your data in InvoiceSnap. Are you sure?')) return;
    STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    setMessage('All data deleted. Page will reload...');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Data Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full bg-white border-2 border-blue-300 text-gray-700 py-3 rounded-xl font-semibold hover:border-blue-500 transition-all text-left px-4 flex items-center gap-3"
          >
            <span className="text-xl">📤</span>
            <div>
              <div>Export</div>
              <div className="text-xs text-gray-500 font-normal">Download all data as JSON</div>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full bg-white border-2 border-blue-300 text-gray-700 py-3 rounded-xl font-semibold hover:border-blue-500 transition-all text-left px-4 flex items-center gap-3"
          >
            <span className="text-xl">📥</span>
            <div>
              <div>Import</div>
              <div className="text-xs text-gray-500 font-normal">Restore data from backup</div>
            </div>
          </button>

          <button
            onClick={handleClear}
            className="w-full bg-white border-2 border-red-300 text-red-600 py-3 rounded-xl font-semibold hover:border-red-500 transition-all text-left px-4 flex items-center gap-3"
          >
            <span className="text-xl">🗑️</span>
            <div>
              <div>Clear data</div>
              <div className="text-xs text-red-400 font-normal">Permanently delete all local data</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
