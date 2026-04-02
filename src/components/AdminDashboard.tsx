import { useState, useEffect } from 'react';
import { apiCall } from '../hooks/useApi';

interface DashboardData {
  totalUsers: number;
  activeToday: number;
  totalInvoices: number;
  planBreakdown: { FREE: number; START: number; PRO: number };
  mrr: number;
  recentUsers: { id: string; email: string; name: string; created_at: string }[];
}

interface LogEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  pinned: boolean;
  resolved: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'concerns', label: 'Concerns', icon: '⚠️' },
  { id: 'idea', label: 'Ideas', icon: '💡' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
];

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'overview' | 'logbook'>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLog, setNewLog] = useState({ category: 'idea', title: '', content: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, logRes] = await Promise.all([
        apiCall('admin.dashboard'),
        apiCall('admin.log.list'),
      ]);
      if (dashRes.ok) setData(dashRes as any);
      if (logRes.ok) setLogs((logRes as any).logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async () => {
    if (!newLog.title.trim()) return;
    try {
      const res = await apiCall('admin.log.create', newLog);
      if (res.ok) {
        setLogs(prev => [(res as any).log, ...prev]);
        setNewLog({ category: 'idea', title: '', content: '' });
      }
    } catch {}
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    try {
      await apiCall('admin.log.update', { id, pinned: !pinned });
      setLogs(prev => prev.map(l => l.id === id ? { ...l, pinned: !pinned } : l));
    } catch {}
  };

  const handleToggleResolved = async (id: string, resolved: boolean) => {
    try {
      await apiCall('admin.log.update', { id, resolved: !resolved });
      setLogs(prev => prev.map(l => l.id === id ? { ...l, resolved: !resolved } : l));
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-semibold text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('logbook')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'logbook' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Logbook
          </button>
        </div>

        {tab === 'overview' && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="text-sm text-gray-600">Users</div>
                <div className="text-2xl font-bold text-gray-900">{data.totalUsers}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <div className="text-sm text-gray-600">Active today</div>
                <div className="text-2xl font-bold text-green-600">{data.activeToday}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <div className="text-sm text-gray-600">Invoices</div>
                <div className="text-2xl font-bold text-gray-900">{data.totalInvoices}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <div className="text-sm text-gray-600">MRR</div>
                <div className="text-2xl font-bold text-blue-600">
                  {((data.mrr || 0) / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                </div>
              </div>
            </div>

            {data.planBreakdown && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold text-gray-900 mb-3">Subscription breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-600">{data.planBreakdown.FREE || 0}</div>
                    <div className="text-xs text-gray-500">FREE</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-600">{data.planBreakdown.START || 0}</div>
                    <div className="text-xs text-blue-600">START</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-600">{data.planBreakdown.PRO || 0}</div>
                    <div className="text-xs text-red-600">PRO</div>
                  </div>
                </div>
              </div>
            )}

            {data.recentUsers && data.recentUsers.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold text-gray-900 mb-3">Recent users</h3>
                <div className="space-y-2">
                  {data.recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.name || user.email}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'logbook' && (
          <div className="space-y-6">
            {/* New logbook entry form */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex gap-3 mb-3">
                <select
                  value={newLog.category}
                  onChange={e => setNewLog(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newLog.title}
                  onChange={e => setNewLog(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <textarea
                value={newLog.content}
                onChange={e => setNewLog(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Details..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
              />
              <button
                onClick={handleCreateLog}
                disabled={!newLog.title.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Create entry
              </button>
            </div>

            {/* Logbook entries */}
            <div className="space-y-3">
              {logs.map(log => {
                const cat = CATEGORIES.find(c => c.id === log.category);
                return (
                  <div key={log.id} className={`bg-white rounded-xl shadow p-4 border-l-4 ${log.resolved ? 'border-green-400 opacity-60' : log.pinned ? 'border-blue-400' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{cat?.icon}</span>
                          <span className="font-semibold text-gray-900 text-sm">{log.title}</span>
                          {log.pinned && <span className="text-xs text-blue-600">📌</span>}
                          {log.resolved && <span className="text-xs text-green-600">✅</span>}
                        </div>
                        {log.content && <p className="text-xs text-gray-600">{log.content}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleTogglePin(log.id, log.pinned)} className="text-xs text-gray-400 hover:text-blue-600">📌</button>
                        <button onClick={() => handleToggleResolved(log.id, log.resolved)} className="text-xs text-gray-400 hover:text-green-600">✅</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
