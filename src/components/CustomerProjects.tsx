import { useState, useEffect } from 'react';
import { invoiceApi, type Invoice } from '../hooks/useApi';

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

interface CustomerSummary {
  name: string;
  invoiceCount: number;
  totalCents: number;
  paidCents: number;
  outstandingCents: number;
  lastInvoiceDate: string;
  invoices: Invoice[];
}

export default function CustomerProjects({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await invoiceApi.list({ countryCode: 'GB' });
        if (res.ok && (res as any).invoices) {
          const invoices = (res as any).invoices as Invoice[];
          const map: Record<string, CustomerSummary> = {};

          for (const inv of invoices) {
            const name = inv.customer?.name || 'Unknown';
            if (!map[name]) {
              map[name] = { name, invoiceCount: 0, totalCents: 0, paidCents: 0, outstandingCents: 0, lastInvoiceDate: '', invoices: [] };
            }
            map[name].invoiceCount++;
            map[name].totalCents += inv.totalCents;
            if (inv.status === 'PAID') map[name].paidCents += inv.totalCents;
            if (inv.status === 'SENT' || inv.status === 'OVERDUE') map[name].outstandingCents += inv.totalCents;
            if (!map[name].lastInvoiceDate || inv.issueDate > map[name].lastInvoiceDate) {
              map[name].lastInvoiceDate = inv.issueDate;
            }
            map[name].invoices.push(inv);
          }

          setCustomers(Object.values(map).sort((a, b) => b.totalCents - a.totalCents));
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (selected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-900 font-semibold text-sm">← Back</button>
            <h1 className="text-2xl font-bold text-gray-900">{selected.name}</h1>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-lg font-bold text-gray-900">{formatGBP(selected.totalCents)}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs text-gray-500">Paid</div>
              <div className="text-lg font-bold text-green-600">{formatGBP(selected.paidCents)}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs text-gray-500">Outstanding</div>
              <div className="text-lg font-bold text-orange-600">{formatGBP(selected.outstandingCents)}</div>
            </div>
          </div>

          <div className="space-y-2">
            {selected.invoices.map(inv => {
              const statusColors: Record<string, string> = {
                DRAFT: 'bg-gray-100 text-gray-700', SENT: 'bg-blue-100 text-blue-700',
                PAID: 'bg-green-100 text-green-700', OVERDUE: 'bg-red-100 text-red-700',
              };
              const statusLabels: Record<string, string> = {
                DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid', OVERDUE: 'Overdue',
              };
              return (
                <div key={inv.id} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{inv.invoiceNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[inv.status] || ''}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(inv.issueDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="font-bold text-gray-900">{formatGBP(inv.totalCents)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-semibold text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Customers & Projects</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customer data...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-600">No customers yet. Create your first invoice!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(c)}
                className="w-full bg-white rounded-xl shadow p-4 border border-gray-100 text-left hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-red-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.invoiceCount} invoices · Last: {new Date(c.lastInvoiceDate).toLocaleDateString('en-GB')}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900 text-sm">{formatGBP(c.totalCents)}</div>
                  {c.outstandingCents > 0 && (
                    <div className="text-xs text-orange-600">{formatGBP(c.outstandingCents)} outstanding</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
