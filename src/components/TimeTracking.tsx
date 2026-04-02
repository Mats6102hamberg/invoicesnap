import { useState } from 'react';

interface TimeEntry {
  id: string;
  date: string;
  project: string;
  description: string;
  hours: number;
  hourlyRate: number;
  billable: boolean;
}

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

export default function TimeTracking({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    const stored = localStorage.getItem('is_time_tracking_v1');
    return stored ? JSON.parse(stored) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    description: '',
    hours: 1,
    hourlyRate: 50,
    billable: true,
  });

  const save = (updated: TimeEntry[]) => {
    setEntries(updated);
    localStorage.setItem('is_time_tracking_v1', JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.project.trim() || !form.description.trim()) return;
    const entry: TimeEntry = { id: String(Date.now()), ...form };
    save([entry, ...entries]);
    setForm({ date: new Date().toISOString().split('T')[0], project: '', description: '', hours: 1, hourlyRate: 50, billable: true });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    save(entries.filter(e => e.id !== id));
  };

  const billableHours = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const revenuePotential = entries.filter(e => e.billable).reduce((s, e) => s + e.hours * e.hourlyRate * 100, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-semibold text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="text-sm text-gray-600">Billable hours</div>
            <div className="text-2xl font-bold text-gray-900">{billableHours.toFixed(1)} hrs</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="text-sm text-gray-600">Revenue potential</div>
            <div className="text-2xl font-bold text-green-600">{formatGBP(revenuePotential)}</div>
          </div>
        </div>

        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all mb-6"
          >
            + Log time
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project/Customer</label>
                <input type="text" value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
                  placeholder="e.g. Acme Ltd" className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What was done?" className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hours</label>
                <input type="number" min="0.25" step="0.25" value={form.hours}
                  onChange={e => setForm(p => ({ ...p, hours: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hourly rate (GBP)</label>
                <input type="number" min="0" value={form.hourlyRate}
                  onChange={e => setForm(p => ({ ...p, hourlyRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.billable}
                    onChange={e => setForm(p => ({ ...p, billable: e.target.checked }))}
                    className="accent-blue-600 w-4 h-4" />
                  <span className="text-sm text-gray-700">Billable</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">Save</button>
              <button onClick={() => setShowForm(false)} className="px-4 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-4xl mb-3">⏱</div>
            <p className="text-gray-600">No hours logged yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <div key={e.id} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{e.project}</span>
                    {e.billable && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">billable</span>}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{e.description}</p>
                  <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900 text-sm">{e.hours}h</div>
                  <div className="text-xs text-gray-500">{formatGBP(e.hours * e.hourlyRate * 100)}</div>
                </div>
                <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
