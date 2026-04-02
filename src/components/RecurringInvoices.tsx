import { useState } from 'react';

interface RecurringInvoice {
  id: string;
  customer: string;
  description: string;
  amountCents: number;
  interval: 'monthly' | 'quarterly' | 'yearly';
  nextDate: string;
  active: boolean;
}

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

const INTERVAL_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export default function RecurringInvoices() {
  const [items, setItems] = useState<RecurringInvoice[]>(() => {
    const stored = localStorage.getItem('is_recurring_v1');
    return stored ? JSON.parse(stored) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    description: '',
    amount: 0,
    interval: 'monthly' as RecurringInvoice['interval'],
  });

  const save = (updated: RecurringInvoice[]) => {
    setItems(updated);
    localStorage.setItem('is_recurring_v1', JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.customer.trim() || !form.description.trim() || form.amount <= 0) return;

    const nextDate = new Date();
    if (form.interval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (form.interval === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);

    const item: RecurringInvoice = {
      id: String(Date.now()),
      customer: form.customer,
      description: form.description,
      amountCents: Math.round(form.amount * 100),
      interval: form.interval,
      nextDate: nextDate.toISOString().split('T')[0],
      active: true,
    };
    save([item, ...items]);
    setForm({ customer: '', description: '', amount: 0, interval: 'monthly' });
    setShowForm(false);
  };

  const handleToggle = (id: string) => {
    save(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring invoice?')) return;
    save(items.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Recurring Invoices</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            + New recurring invoice
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Customer</label>
              <input type="text" value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))}
                placeholder="e.g. Acme Ltd" className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (GBP)</label>
              <input type="number" min="0" step="0.01" value={form.amount || ''}
                onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00" className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Monthly maintenance" className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Interval</label>
            <select value={form.interval} onChange={e => setForm(p => ({ ...p, interval: e.target.value as any }))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-gray-600">No recurring invoices set up</p>
          <p className="text-xs text-gray-400 mt-1">Automate your repeating invoices</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-xl shadow p-4 border border-gray-100 ${!item.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{item.customer}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{INTERVAL_LABELS[item.interval]}</span>
                    {!item.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Paused</span>}
                  </div>
                  <p className="text-xs text-gray-600">{item.description}</p>
                  <p className="text-xs text-gray-400">Next: {new Date(item.nextDate).toLocaleDateString('en-GB')}</p>
                </div>
                <div className="text-right shrink-0 mr-3">
                  <div className="font-bold text-gray-900">{formatGBP(item.amountCents)}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleToggle(item.id)} className="text-xs text-gray-400 hover:text-blue-600">{item.active ? '⏸' : '▶️'}</button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-gray-400 hover:text-red-600">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
