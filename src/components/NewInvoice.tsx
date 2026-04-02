import { useState, useEffect } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import { customerApi, invoiceApi } from '../hooks/useApi';

interface NewInvoiceProps {
  onBack: () => void;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface CustomerDetails {
  name: string;
  street: string;
  postcode: string;
  city: string;
  vatNumber: string;
}

interface CompanyDetails {
  companyName: string;
  directorName: string;
  legalForm: string;
  companiesHouseNumber: string;
  vatNumber: string;
  street: string;
  postcode: string;
  city: string;
  sortCode: string;
  accountNumber: string;
  iban: string;
  email: string;
  phone: string;
  flatRateScheme: boolean;
}

interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  dueDate: string;
  customer: CustomerDetails;
  lines: LineItem[];
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  flatRateScheme: boolean;
  paymentTerms: number;
  companySnapshot: CompanyDetails | null;
  createdAt: string;
}

const VAT_RATES = [
  { value: 20, label: '20% (standard)' },
  { value: 5, label: '5% (reduced)' },
  { value: 0, label: '0% (zero-rated)' },
];

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${year}-${rand}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

export default function NewInvoice({ onBack }: NewInvoiceProps) {
  const { canCreateInvoice } = useSubscriptionContext();
  const [view, setView] = useState<'form' | 'preview'>('form');

  // Company details
  const [company, setCompany] = useState<CompanyDetails | null>(null);

  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [deliveryDate, setDeliveryDate] = useState(todayStr());
  const [paymentTerms, setPaymentTerms] = useState(30);

  // Customer
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '', street: '', postcode: '', city: '', vatNumber: '',
  });

  // Line items
  const [lines, setLines] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, vatRate: 20 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('is_company_profile_v1');
    if (stored) {
      try { setCompany(JSON.parse(stored)); } catch {}
    }
  }, []);

  const isFlatRate = company?.flatRateScheme ?? false;

  const updateCustomer = (field: keyof CustomerDetails, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const addLine = () => {
    setLines(prev => [...prev, {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: isFlatRate ? 0 : 20,
    }]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(p => p.id !== id));
  };

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setLines(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Calculations
  const netAmount = lines.reduce((sum, p) => sum + (p.quantity * p.unitPrice * 100), 0);
  const vatDetails = lines.reduce((acc, p) => {
    const net = p.quantity * p.unitPrice * 100;
    const rate = isFlatRate ? 0 : p.vatRate;
    const vat = Math.round(net * rate / 100);
    if (!acc[rate]) acc[rate] = 0;
    acc[rate] += vat;
    return acc;
  }, {} as Record<number, number>);
  const vatAmount = Object.values(vatDetails).reduce((s, v) => s + v, 0);
  const totalAmount = netAmount + vatAmount;

  const dueDate = addDays(invoiceDate, paymentTerms);

  const validate = (): string | null => {
    if (!customer.name.trim()) return 'Please enter the customer name';
    if (lines.some(p => !p.description.trim())) return 'Please fill in all descriptions';
    if (lines.some(p => p.unitPrice <= 0)) return 'All prices must be greater than 0';
    if (!company) return 'Please set up your company profile first';
    return null;
  };

  const handlePreview = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setView('preview');
  };

  const handleSave = async (status: SavedInvoice['status'] = 'draft') => {
    setSaving(true);
    setError('');
    try {
      // 1. Save customer to DB
      const custRes = await customerApi.upsert({
        name: customer.name,
        address1: customer.street,
        zip: customer.postcode,
        city: customer.city,
        vatId: customer.vatNumber || undefined,
        countryCode: 'GB',
      });
      if (!custRes.ok) throw new Error(custRes.error || 'Could not save customer');

      const customerId = (custRes as any).customer.id;

      // Status mapping to DB enum
      const statusMap: Record<string, string> = {
        draft: 'DRAFT',
        sent: 'SENT',
        paid: 'PAID',
        overdue: 'OVERDUE',
      };

      // 2. Create invoice in DB
      const invoiceLines = lines.map(p => ({
        description: p.description,
        quantity: p.quantity,
        unitPriceCents: Math.round(p.unitPrice * 100),
        vatRate: isFlatRate ? 0 : p.vatRate,
        lineTotalCents: Math.round(p.quantity * p.unitPrice * 100),
      }));

      const invoiceRes = await invoiceApi.create({
        invoiceNo: invoiceNumber,
        status: statusMap[status] || 'DRAFT',
        currency: 'GBP',
        issueDate: invoiceDate,
        dueDate: dueDate,
        customerId,
        subtotalCents: netAmount,
        vatCents: vatAmount,
        totalCents: totalAmount,
        countryCode: 'GB',
        notes: isFlatRate ? 'VAT flat rate scheme – VAT not charged on this invoice' : null,
        lines: invoiceLines,
      });

      if (!invoiceRes.ok) throw new Error(invoiceRes.error || 'Could not save invoice');

      // Also save to localStorage as fallback
      const invoice: SavedInvoice = {
        id: (invoiceRes as any).invoice?.id || String(Date.now()),
        invoiceNumber,
        invoiceDate,
        deliveryDate,
        dueDate,
        customer,
        lines,
        netAmount,
        vatAmount,
        totalAmount,
        status,
        flatRateScheme: isFlatRate,
        paymentTerms,
        companySnapshot: company,
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('is_invoices_v1') || '[]');
      existing.push(invoice);
      localStorage.setItem('is_invoices_v1', JSON.stringify(existing));

      onBack();
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Error saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!canCreateInvoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice limit reached</h2>
            <p className="text-gray-600 mb-6">
              You have used your free allowance. Upgrade for unlimited invoices.
            </p>
            <button
              onClick={onBack}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview
  if (view === 'preview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setView('form')}
              className="bg-white border-2 border-blue-300 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:border-blue-500 transition-all"
            >
              ← Edit
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Preview</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-gray-600">{invoiceNumber}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Invoice date: {new Date(invoiceDate).toLocaleDateString('en-GB')}</p>
                <p>Delivery date: {new Date(deliveryDate).toLocaleDateString('en-GB')}</p>
                <p>Due date: {new Date(dueDate).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            {/* From / To */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">From</div>
                <div className="text-sm">
                  <p className="font-semibold">{company?.companyName}</p>
                  {company?.directorName && <p>{company.directorName}</p>}
                  <p>{company?.street}</p>
                  <p>{company?.postcode} {company?.city}</p>
                  {company?.companiesHouseNumber && <p className="mt-1">Co. No: {company.companiesHouseNumber}</p>}
                  {company?.vatNumber && <p>VAT No: {company.vatNumber}</p>}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">To</div>
                <div className="text-sm">
                  <p className="font-semibold">{customer.name}</p>
                  <p>{customer.street}</p>
                  <p>{customer.postcode} {customer.city}</p>
                  {customer.vatNumber && <p className="mt-1">VAT No: {customer.vatNumber}</p>}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 font-semibold">No.</th>
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-right py-2 font-semibold">Qty</th>
                  <th className="text-right py-2 font-semibold">Unit Price</th>
                  {!isFlatRate && <th className="text-right py-2 font-semibold">VAT</th>}
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2">{i + 1}</td>
                    <td className="py-2">{p.description}</td>
                    <td className="py-2 text-right">{p.quantity}</td>
                    <td className="py-2 text-right">{formatGBP(p.unitPrice * 100)}</td>
                    {!isFlatRate && <td className="py-2 text-right">{p.vatRate}%</td>}
                    <td className="py-2 text-right font-semibold">{formatGBP(p.quantity * p.unitPrice * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatGBP(netAmount)}</span>
                </div>
                {!isFlatRate && Object.entries(vatDetails).map(([rate, amount]) => (
                  <div key={rate} className="flex justify-between text-gray-600">
                    <span>VAT {rate}%</span>
                    <span>{formatGBP(amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-900 pt-1">
                  <span>Total</span>
                  <span>{formatGBP(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Flat rate scheme notice */}
            {isFlatRate && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-gray-700">
                VAT flat rate scheme – VAT is not charged on this invoice.
              </div>
            )}

            {/* Payment details */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <div className="font-semibold mb-2">Payment Details</div>
              <p>Please pay {formatGBP(totalAmount)} by {new Date(dueDate).toLocaleDateString('en-GB')} to:</p>
              {company?.sortCode && <p className="mt-1">Sort code: {company.sortCode}</p>}
              {company?.accountNumber && <p>Account number: {company.accountNumber}</p>}
              {company?.iban && <p>IBAN: {company.iban}</p>}
              <p>Reference: {invoiceNumber}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="flex-1 min-w-[140px] bg-white border-2 border-blue-300 text-gray-700 py-3 rounded-xl font-semibold hover:border-blue-500 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as draft'}
              </button>
              <button
                onClick={() => handleSave('sent')}
                disabled={saving}
                className="flex-1 min-w-[140px] bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="bg-white border-2 border-blue-300 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:border-blue-500 transition-all"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">📝 New Invoice</h1>
        </div>

        {!company && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
            <p className="text-amber-800 font-semibold">⚠️ Company profile missing</p>
            <p className="text-amber-700 text-sm mt-1">
              Please set up your company profile first so your details appear on the invoice.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Invoice details */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Invoice Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment terms</label>
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer details */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name / Company *</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={e => updateCustomer('name', e.target.value)}
                  placeholder="Acme Ltd"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Street address</label>
                <input
                  type="text"
                  value={customer.street}
                  onChange={e => updateCustomer('street', e.target.value)}
                  placeholder="10 Downing Street"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Postcode</label>
                  <input
                    type="text"
                    value={customer.postcode}
                    onChange={e => updateCustomer('postcode', e.target.value)}
                    placeholder="SW1A 2AA"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={customer.city}
                    onChange={e => updateCustomer('city', e.target.value)}
                    placeholder="London"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer VAT number (optional)</label>
                <input
                  type="text"
                  value={customer.vatNumber}
                  onChange={e => updateCustomer('vatNumber', e.target.value)}
                  placeholder="GB123456789"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Line Items</h2>
            <div className="space-y-4">
              {lines.map((p, i) => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Line {i + 1}</span>
                    {lines.length > 1 && (
                      <button
                        onClick={() => removeLine(p.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={p.description}
                      onChange={e => updateLine(p.id, 'description', e.target.value)}
                      placeholder="Service / Product"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={p.quantity}
                        onChange={e => updateLine(p.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Unit price (GBP)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.unitPrice || ''}
                        onChange={e => updateLine(p.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">VAT rate</label>
                      <select
                        value={isFlatRate ? 0 : p.vatRate}
                        onChange={e => updateLine(p.id, 'vatRate', Number(e.target.value))}
                        disabled={isFlatRate}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white disabled:bg-gray-100"
                      >
                        {VAT_RATES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-gray-700">
                    Net: {formatGBP(p.quantity * p.unitPrice * 100)}
                  </div>
                </div>
              ))}

              <button
                onClick={addLine}
                className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-3 rounded-xl font-semibold hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                + Add line item
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-red-50 border border-blue-200 rounded-xl p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatGBP(netAmount)}</span>
              </div>
              {!isFlatRate && Object.entries(vatDetails).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-gray-600">
                  <span>VAT {rate}%</span>
                  <span>{formatGBP(amount)}</span>
                </div>
              ))}
              {isFlatRate && (
                <div className="flex justify-between text-gray-600 italic">
                  <span>No VAT (flat rate scheme)</span>
                  <span>{formatGBP(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-blue-300 pt-2 mt-2">
                <span>Total</span>
                <span>{formatGBP(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Required information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <div className="font-semibold mb-1">Required invoice information (HMRC)</div>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Your business name, address and contact details</li>
              <li>The customer's name and address</li>
              <li>Your VAT registration number (if VAT registered)</li>
              <li>A unique sequential invoice number</li>
              <li>The invoice date and date of supply</li>
              <li>A description of the goods or services supplied</li>
              <li>The total amount excluding VAT, VAT rate and VAT amount</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 bg-white border-2 border-blue-300 text-gray-700 py-3 rounded-xl font-semibold hover:border-blue-500 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePreview}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Preview invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
