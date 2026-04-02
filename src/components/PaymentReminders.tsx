import { useState, useEffect } from 'react';
import { invoiceApi, downloadInvoicePdf, type Invoice } from '../hooks/useApi';

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function getReminderLevel(daysOverdue: number): { level: number; label: string; color: string; description: string } {
  if (daysOverdue <= 14) {
    return { level: 1, label: '1st reminder', color: 'bg-yellow-100 text-yellow-800', description: 'Polite payment reminder' };
  }
  if (daysOverdue <= 30) {
    return { level: 2, label: '2nd reminder', color: 'bg-orange-100 text-orange-800', description: 'Formal reminder with deadline' };
  }
  return { level: 3, label: 'Final notice', color: 'bg-red-100 text-red-800', description: 'Final notice before legal action (Late Payment of Commercial Debts Act 1998)' };
}

export default function PaymentReminders() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOverdue();
  }, []);

  const loadOverdue = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.list({ countryCode: 'GB' });
      if (res.ok && (res as any).invoices) {
        const today = new Date().toISOString().split('T')[0];
        const overdue = ((res as any).invoices as Invoice[]).filter(inv =>
          inv.status === 'SENT' && inv.dueDate && inv.dueDate.split('T')[0] < today
        );
        setInvoices(overdue.sort((a, b) => {
          const dA = daysSince(a.dueDate!);
          const dB = daysSince(b.dueDate!);
          return dB - dA;
        }));
      }
    } catch (err) {
      console.error('Failed to load overdue invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await invoiceApi.update(id, { status: 'PAID', paidAt: new Date().toISOString() });
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch {}
  };

  const handleDownloadPdf = async (id: string, invoiceNo: string) => {
    setPdfLoading(id);
    try {
      await downloadInvoicePdf(id, invoiceNo);
    } catch {
      alert('Could not generate PDF.');
    } finally {
      setPdfLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading overdue invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No overdue invoices</h3>
        <p className="text-gray-600">All invoices have been paid on time.</p>
      </div>
    );
  }

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.totalCents, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-red-700 font-semibold">Overdue invoices</div>
            <div className="text-2xl font-bold text-red-800">{invoices.length} invoices</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-red-700">Outstanding amount</div>
            <div className="text-2xl font-bold text-red-800">{formatGBP(totalOutstanding)}</div>
          </div>
        </div>
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {invoices.map(inv => {
          const daysOver = daysSince(inv.dueDate!);
          const reminder = getReminderLevel(daysOver);

          return (
            <div key={inv.id} className="bg-white rounded-xl shadow border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{inv.invoiceNo}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${reminder.color}`}>
                      {reminder.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{inv.customer?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    Due date: {new Date(inv.dueDate!).toLocaleDateString('en-GB')} ({daysOver} days overdue)
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatGBP(inv.totalCents)}</div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3">{reminder.description}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkPaid(inv.id)}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                >
                  Mark as paid
                </button>
                <button
                  onClick={() => handleDownloadPdf(inv.id, inv.invoiceNo)}
                  disabled={pdfLoading === inv.id}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  {pdfLoading === inv.id ? 'Loading...' : 'PDF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legal information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <div className="font-semibold mb-1">UK late payment legislation</div>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
          <li>Statutory interest: 8% plus the Bank of England base rate (Late Payment of Commercial Debts (Interest) Act 1998)</li>
          <li>Compensation for debt recovery costs: from {formatGBP(4000)} to {formatGBP(10000)} depending on debt size</li>
          <li>You may also claim reasonable recovery costs beyond the fixed compensation</li>
          <li>Standard payment terms are 30 days unless otherwise agreed in the contract</li>
        </ul>
      </div>
    </div>
  );
}
