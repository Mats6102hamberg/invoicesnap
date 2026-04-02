import { useState, useEffect } from 'react';
import { invoiceApi, downloadInvoicePdf, type Invoice } from '../hooks/useApi';

interface InvoiceListProps {
  onBack: () => void;
}

interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customer: { name: string; street: string; postcode: string; city: string; vatNumber: string };
  lines: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  flatRateScheme: boolean;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
};

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

export default function InvoiceList({ onBack }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<SavedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  // Map DB Invoice to local SavedInvoice format
  const mapInvoiceToLocal = (inv: Invoice): SavedInvoice => {
    const statusMap: Record<string, SavedInvoice['status']> = {
      DRAFT: 'draft', SENT: 'sent', PAID: 'paid', OVERDUE: 'overdue',
    };
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNo,
      invoiceDate: inv.issueDate.split('T')[0],
      dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
      customer: {
        name: inv.customer?.name || '',
        street: inv.customer?.address1 || '',
        postcode: inv.customer?.zip || '',
        city: inv.customer?.city || '',
        vatNumber: inv.customer?.vatId || '',
      },
      lines: (inv.lines || []).map(l => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPriceCents / 100,
        vatRate: l.vatRate,
      })),
      netAmount: inv.subtotalCents,
      vatAmount: inv.vatCents,
      totalAmount: inv.totalCents,
      status: statusMap[inv.status] || 'draft',
      flatRateScheme: inv.vatCents === 0 && inv.subtotalCents > 0,
      createdAt: inv.createdAt,
    };
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      // Try the DB first
      const res = await invoiceApi.list({ countryCode: 'GB' });
      if (res.ok && (res as any).invoices?.length) {
        const mapped = ((res as any).invoices as Invoice[]).map(mapInvoiceToLocal);
        const today = new Date().toISOString().split('T')[0];
        const updated = mapped.map(r => {
          if (r.status === 'sent' && r.dueDate < today) {
            return { ...r, status: 'overdue' as const };
          }
          return r;
        });
        setInvoices(updated);
        setLoading(false);
        return;
      }
    } catch {
      // Fall back to localStorage if API fails
    }

    // localStorage fallback
    const stored = localStorage.getItem('is_invoices_v1');
    if (stored) {
      try {
        const data = JSON.parse(stored) as SavedInvoice[];
        const today = new Date().toISOString().split('T')[0];
        const updated = data.map(r => {
          if (r.status === 'sent' && r.dueDate < today) {
            return { ...r, status: 'overdue' as const };
          }
          return r;
        });
        setInvoices(updated.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } catch {}
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceApi.delete(id);
    } catch {}
    const updated = invoices.filter(r => r.id !== id);
    localStorage.setItem('is_invoices_v1', JSON.stringify(updated));
    setInvoices(updated);
    setSelected(null);
  };

  const handleStatusChange = async (id: string, newStatus: SavedInvoice['status']) => {
    const statusMap: Record<string, string> = {
      draft: 'DRAFT', sent: 'SENT', paid: 'PAID', overdue: 'OVERDUE',
    };
    try {
      await invoiceApi.update(id, { status: statusMap[newStatus] });
    } catch {}
    const updated = invoices.map(r =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    localStorage.setItem('is_invoices_v1', JSON.stringify(updated));
    setInvoices(updated);
    if (selected?.id === id) {
      setSelected({ ...selected, status: newStatus });
    }
  };

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    setPdfLoading(id);
    try {
      await downloadInvoicePdf(id, invoiceNumber);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setPdfLoading(null);
    }
  };

  const filtered = invoices.filter(r => {
    const matchSearch = !search ||
      r.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Detail view
  if (selected) {
    const s = STATUS_LABELS[selected.status];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelected(null)}
              className="bg-white border-2 border-blue-300 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:border-blue-500 transition-all"
            >
              ← Back to list
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${s.color}`}>
              {s.label}
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-gray-600">{selected.invoiceNumber}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Date: {new Date(selected.invoiceDate).toLocaleDateString('en-GB')}</p>
                <p>Due date: {new Date(selected.dueDate).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Customer</div>
              <p className="font-semibold">{selected.customer.name}</p>
              {selected.customer.street && <p className="text-sm text-gray-600">{selected.customer.street}</p>}
              {(selected.customer.postcode || selected.customer.city) && (
                <p className="text-sm text-gray-600">{selected.customer.postcode} {selected.customer.city}</p>
              )}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.lines.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">{p.description}</td>
                    <td className="py-2 text-right">{p.quantity}</td>
                    <td className="py-2 text-right">{formatGBP(p.unitPrice * 100)}</td>
                    <td className="py-2 text-right font-semibold">{formatGBP(p.quantity * p.unitPrice * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatGBP(selected.netAmount)}</span>
                </div>
                {!selected.flatRateScheme && (
                  <div className="flex justify-between text-gray-600">
                    <span>VAT</span>
                    <span>{formatGBP(selected.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-900 pt-1">
                  <span>Total</span>
                  <span>{formatGBP(selected.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <button
                onClick={() => handleDownloadPdf(selected.id, selected.invoiceNumber)}
                disabled={pdfLoading === selected.id}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {pdfLoading === selected.id ? 'Generating PDF...' : 'Download PDF'}
              </button>
              {selected.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange(selected.id, 'sent')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Mark as sent
                </button>
              )}
              {(selected.status === 'sent' || selected.status === 'overdue') && (
                <button
                  onClick={() => handleStatusChange(selected.id, 'paid')}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Mark as paid
                </button>
              )}
              {selected.status === 'draft' && (
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="bg-white border-2 border-red-300 text-red-600 px-4 py-2 rounded-xl font-semibold hover:border-red-500 transition-all"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="bg-white border-2 border-blue-300 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:border-blue-500 transition-all"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">📋 Invoice List</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer or invoice number..."
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4 animate-pulse">📋</div>
            <p className="text-gray-600">Loading invoices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {invoices.length === 0 ? 'No invoices yet' : 'No results'}
            </h3>
            <p className="text-gray-600">
              {invoices.length === 0
                ? 'Create your first invoice!'
                : 'Try different search terms'}
            </p>
            {search && (
              <button
                onClick={() => { setSearch(''); setFilterStatus('all'); }}
                className="mt-4 text-blue-600 font-semibold hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const s = STATUS_LABELS[r.status];
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full bg-white rounded-xl shadow p-4 text-left hover:shadow-md transition-all border border-gray-100 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{r.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{r.customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.invoiceDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatGBP(r.totalAmount)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
