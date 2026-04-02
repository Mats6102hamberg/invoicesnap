import { useState, useRef } from 'react';
import { apiCall } from '../hooks/useApi';

interface Receipt {
  id: string;
  date: string;
  supplier: string;
  amount: number;
  category: string;
  vatRate: number;
  description: string;
  imageUrl?: string;
}

const CATEGORIES = [
  { value: 'office', label: 'Office Supplies', icon: '📎' },
  { value: 'telecom', label: 'Phone & Internet', icon: '📱' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'entertainment', label: 'Entertainment', icon: '🍽' },
  { value: 'vehicle', label: 'Vehicle Costs', icon: '🚗' },
  { value: 'insurance', label: 'Insurance', icon: '🛡' },
  { value: 'rent', label: 'Rent', icon: '🏢' },
  { value: 'advertising', label: 'Advertising', icon: '📢' },
  { value: 'materials', label: 'Materials', icon: '📦' },
  { value: 'other', label: 'Other', icon: '📋' },
];

function formatGBP(amount: number): string {
  return amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

export default function ReceiptScanner() {
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const stored = localStorage.getItem('is_receipts_v1');
    return stored ? JSON.parse(stored) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    amount: 0,
    category: 'other',
    vatRate: 20,
    description: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const save = (updated: Receipt[]) => {
    setReceipts(updated);
    localStorage.setItem('is_receipts_v1', JSON.stringify(updated));
  };

  const handleScan = async (file: File) => {
    setScanning(true);
    try {
      const res = await apiCall('boris.chat', {
        message: `Analyse this receipt. Filename: ${file.name}, Size: ${(file.size / 1024).toFixed(0)} KB. Extract: supplier, amount, date, category (Office Supplies/Phone & Internet/Travel/Entertainment/Vehicle Costs/Insurance/Rent/Advertising/Materials/Other), VAT rate (20%, 5% or 0%). Reply in structured English.`,
        language: 'en',
        context: 'invoicesnap',
      });
      if (res.ok && (res as any).reply) {
        setShowForm(true);
        setForm(prev => ({ ...prev, description: `Receipt: ${file.name}` }));
      }
    } catch {}
    setScanning(false);
  };

  const handleAdd = () => {
    if (!form.supplier.trim() || form.amount <= 0) return;
    const receipt: Receipt = {
      id: String(Date.now()),
      ...form,
    };

    // Also save to backend
    apiCall('receipt.create', {
      merchant: form.supplier,
      amountCents: Math.round(form.amount * 100),
      category: form.category,
      vatRate: form.vatRate,
      description: form.description,
      date: form.date,
    }).catch(() => {});

    save([receipt, ...receipts]);
    setForm({ date: new Date().toISOString().split('T')[0], supplier: '', amount: 0, category: 'other', vatRate: 20, description: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    save(receipts.filter(b => b.id !== id));
  };

  const totalExpenses = receipts.reduce((s, b) => s + b.amount, 0);
  const totalInputVAT = receipts.reduce((s, b) => s + (b.amount * b.vatRate / (100 + b.vatRate)), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <div className="text-xs text-gray-500">Total expenses</div>
          <div className="text-xl font-bold text-gray-900">{formatGBP(totalExpenses)}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <div className="text-xs text-gray-500">Input VAT (reclaimable)</div>
          <div className="text-xl font-bold text-green-600">{formatGBP(totalInputVAT)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : '📷 Scan receipt'}
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 bg-white border-2 border-blue-300 text-gray-700 py-3 rounded-xl font-semibold hover:border-blue-500"
        >
          ✍️ Manual entry
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleScan(f); }} />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier</label>
              <input type="text" value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                placeholder="e.g. Amazon" className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (GBP)</label>
              <input type="number" min="0" step="0.01" value={form.amount || ''}
                onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white">
                {CATEGORIES.map(k => <option key={k.value} value={k.value}>{k.icon} {k.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">VAT</label>
              <select value={form.vatRate} onChange={e => setForm(p => ({ ...p, vatRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white">
                <option value={20}>20%</option>
                <option value={5}>5%</option>
                <option value={0}>0%</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
            <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Printer cartridges" className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {/* Receipt list */}
      {receipts.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-gray-600">No receipts recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map(b => {
            const cat = CATEGORIES.find(k => k.value === b.category);
            return (
              <div key={b.id} className="bg-white rounded-xl shadow p-3 border border-gray-100 flex items-center gap-3">
                <span className="text-xl">{cat?.icon || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{b.supplier}</div>
                  <p className="text-xs text-gray-500">{cat?.label} · {new Date(b.date).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="font-bold text-gray-900 text-sm">{formatGBP(b.amount)}</div>
                <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
