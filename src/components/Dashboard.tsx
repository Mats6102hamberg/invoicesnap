import { useState, useEffect } from 'react';
import { invoiceApi, type Invoice } from '../hooks/useApi';

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

interface Stats {
  totalInvoices: number;
  drafts: number;
  sent: number;
  paid: number;
  overdue: number;
  revenue: number;
  outstanding: number;
  topCustomers: { name: string; total: number }[];
  monthlyRevenue: { month: string; total: number }[];
}

function calculateStats(invoices: Invoice[]): Stats {
  const stats: Stats = {
    totalInvoices: invoices.length,
    drafts: 0, sent: 0, paid: 0, overdue: 0,
    revenue: 0, outstanding: 0,
    topCustomers: [],
    monthlyRevenue: [],
  };

  const customerTotals: Record<string, { name: string; total: number }> = {};
  const monthTotals: Record<string, number> = {};
  const today = new Date().toISOString().split('T')[0];

  for (const inv of invoices) {
    const isOverdue = inv.status === 'SENT' && inv.dueDate && inv.dueDate.split('T')[0] < today;

    if (inv.status === 'DRAFT') stats.drafts++;
    else if (isOverdue) stats.overdue++;
    else if (inv.status === 'SENT') stats.sent++;
    else if (inv.status === 'PAID') stats.paid++;

    if (inv.status === 'PAID') {
      stats.revenue += inv.totalCents;
    }
    if (inv.status === 'SENT' || isOverdue) {
      stats.outstanding += inv.totalCents;
    }

    // Customer totals
    const custName = inv.customer?.name || 'Unknown';
    if (!customerTotals[custName]) customerTotals[custName] = { name: custName, total: 0 };
    customerTotals[custName].total += inv.totalCents;

    // Monthly revenue (paid only)
    if (inv.status === 'PAID') {
      const month = inv.issueDate.substring(0, 7); // YYYY-MM
      monthTotals[month] = (monthTotals[month] || 0) + inv.totalCents;
    }
  }

  stats.topCustomers = Object.values(customerTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  stats.monthlyRevenue = Object.entries(monthTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  return stats;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await invoiceApi.list({ countryCode: 'GB' });
        if (res.ok && (res as any).invoices) {
          setStats(calculateStats((res as any).invoices));
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <div className="text-sm text-gray-600">Revenue (paid)</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{formatGBP(stats.revenue)}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <div className="text-sm text-gray-600">Outstanding</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{formatGBP(stats.outstanding)}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <div className="text-sm text-gray-600">Total invoices</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalInvoices}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className={`text-2xl font-bold mt-1 ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.overdue}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Invoice Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.drafts}</div>
            <div className="text-xs text-gray-500 mt-1">Drafts</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-xs text-blue-600 mt-1">Sent</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-xs text-green-600 mt-1">Paid</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-red-600 mt-1">Overdue</div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      {stats.topCustomers.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {stats.topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6">{i + 1}.</span>
                  <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{formatGBP(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Revenue */}
      {stats.monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="space-y-2">
            {stats.monthlyRevenue.map((m, i) => {
              const maxRevenue = Math.max(...stats.monthlyRevenue.map(x => x.total));
              const width = maxRevenue > 0 ? (m.total / maxRevenue) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 shrink-0">{m.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-red-500 h-full rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-24 text-right">{formatGBP(m.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
