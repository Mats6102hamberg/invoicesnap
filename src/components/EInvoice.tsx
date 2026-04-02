import { useState, useEffect } from 'react';
import { invoiceApi, type Invoice } from '../hooks/useApi';
import { API_URL } from '../config';

export default function EInvoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await invoiceApi.list({ countryCode: 'GB' });
        if (res.ok && (res as any).invoices) {
          // Only show non-draft invoices for e-invoicing
          const eligible = ((res as any).invoices as Invoice[]).filter(
            inv => inv.status !== 'DRAFT'
          );
          setInvoices(eligible);
        }
      } catch {}
      setLoadingList(false);
    })();
  }, []);

  const handleGenerate = async () => {
    if (!selectedId) { setError('Please select an invoice'); return; }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'invoice.xrechnung',
          id: selectedId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create e-invoice');
      }

      const blob = await res.blob();
      const invoice = invoices.find(i => i.id === selectedId);
      const filename = `${invoice?.invoiceNo || 'Invoice'}_UBL.xml`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(`E-invoice for ${invoice?.invoiceNo} created successfully`);
    } catch (err: any) {
      setError(err.message || 'Error creating e-invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Information banner */}
      <div className="bg-gradient-to-r from-blue-50 to-red-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <h3 className="font-bold text-blue-800 text-sm">E-invoicing in the UK</h3>
            <p className="text-xs text-blue-700 mt-1">
              The UK government supports e-invoicing through the Peppol network.
              E-invoicing is increasingly used for B2G (Business-to-Government) transactions.
              UBL invoices improve efficiency and reduce processing errors.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Create e-invoice</h3>

        <div className="space-y-4">
          {/* Select invoice */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select invoice</label>
            {loadingList ? (
              <p className="text-sm text-gray-500">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-500">No eligible invoices available (only sent/paid)</p>
            ) : (
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Select an invoice --</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNo} – {inv.customer?.name} – {(inv.totalCents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Format</label>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-blue-500 bg-blue-50 cursor-pointer">
                <input
                  type="radio"
                  checked
                  readOnly
                  className="accent-blue-600"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-900">UBL 2.1 (XML)</div>
                  <div className="text-xs text-gray-500">EN 16931 – European standard, suitable for Peppol and UK government</div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedId}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Download e-invoice (UBL XML)'}
          </button>
        </div>
      </div>

      {/* Peppol information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <div className="font-semibold mb-1">Peppol & e-invoicing</div>
        <p className="text-xs">
          Peppol is the international network for exchanging e-invoices.
          In the UK, Peppol is supported by the Cabinet Office for public sector procurement.
        </p>
        <p className="text-xs mt-1">
          <strong>Benefits:</strong> Faster payment, fewer errors, automatic processing
          in accounting software, and reduced administration costs.
        </p>
        <p className="text-xs mt-1">
          <strong>Validation:</strong> You can validate your UBL invoice using online
          Peppol validation tools or your accounting software.
        </p>
      </div>
    </div>
  );
}
