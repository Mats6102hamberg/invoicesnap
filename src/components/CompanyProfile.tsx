import { useState, useEffect } from 'react';
import { apiCall } from '../hooks/useApi';

interface CompanyProfileProps {
  onBack: () => void;
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

const LEGAL_FORMS = [
  { value: 'sole-trader', label: 'Sole Trader' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'ltd', label: 'Ltd (Private Limited)' },
  { value: 'plc', label: 'PLC' },
];

const EMPTY_PROFILE: CompanyDetails = {
  companyName: '',
  directorName: '',
  legalForm: 'sole-trader',
  companiesHouseNumber: '',
  vatNumber: '',
  street: '',
  postcode: '',
  city: '',
  sortCode: '',
  accountNumber: '',
  iban: '',
  email: '',
  phone: '',
  flatRateScheme: false,
};

export default function CompanyProfile({ onBack }: CompanyProfileProps) {
  const [data, setData] = useState<CompanyDetails>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Try to load from backend first, fall back to localStorage
    (async () => {
      try {
        const res = await apiCall('profile.get');
        if (res.ok && (res as any).profile?.profileData) {
          const pd = (res as any).profile.profileData;
          setData({ ...EMPTY_PROFILE, ...pd });
          localStorage.setItem('is_company_profile_v1', JSON.stringify(pd));
          return;
        }
      } catch {}
      const stored = localStorage.getItem('is_company_profile_v1');
      if (stored) {
        try { setData({ ...EMPTY_PROFILE, ...JSON.parse(stored) }); } catch {}
      }
    })();
  }, []);

  const update = (field: keyof CompanyDetails, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Save to localStorage immediately
    localStorage.setItem('is_company_profile_v1', JSON.stringify(data));
    // Also save to backend
    try {
      await apiCall('profile.save', { profileType: 'business', profileData: data });
    } catch (err) {
      console.error('Failed to save profile to backend:', err);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">🏢 Company Profile</h1>
        </div>

        {saved && (
          <div className="bg-green-50 border-2 border-green-500 text-green-800 rounded-xl p-4 mb-6 font-semibold">
            ✅ Company profile saved!
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Company details */}
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Company Details</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company name</label>
              <input
                type="text"
                value={data.companyName}
                onChange={e => update('companyName', e.target.value)}
                placeholder="Acme Ltd"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Director name</label>
              <input
                type="text"
                value={data.directorName}
                onChange={e => update('directorName', e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Legal form</label>
            <select
              value={data.legalForm}
              onChange={e => update('legalForm', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
            >
              {LEGAL_FORMS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="text"
                inputMode="email"
                value={data.email}
                onChange={e => update('email', e.target.value)}
                placeholder="info@company.co.uk"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={data.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+44 20 7946 0958"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tax details */}
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">Tax Details</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Companies House number</label>
              <input
                type="text"
                value={data.companiesHouseNumber}
                onChange={e => update('companiesHouseNumber', e.target.value)}
                placeholder="12345678"
                maxLength={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">VAT number</label>
              <input
                type="text"
                value={data.vatNumber}
                onChange={e => update('vatNumber', e.target.value.toUpperCase())}
                placeholder="GB123456789"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.flatRateScheme}
                onChange={e => update('flatRateScheme', e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 rounded"
              />
              <div>
                <div className="font-semibold text-gray-900">VAT flat rate scheme</div>
                <p className="text-sm text-gray-600 mt-1">
                  Do not charge VAT on invoices (simplified VAT accounting for eligible small businesses)
                </p>
              </div>
            </label>
          </div>

          {/* Address */}
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">Address</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Street address</label>
            <input
              type="text"
              value={data.street}
              onChange={e => update('street', e.target.value)}
              placeholder="10 Downing Street"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Postcode</label>
              <input
                type="text"
                value={data.postcode}
                onChange={e => update('postcode', e.target.value)}
                placeholder="SW1A 2AA"
                maxLength={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={data.city}
                onChange={e => update('city', e.target.value)}
                placeholder="London"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bank details */}
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">Bank Details</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort code</label>
              <input
                type="text"
                value={data.sortCode}
                onChange={e => update('sortCode', e.target.value)}
                placeholder="12-34-56"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account number</label>
              <input
                type="text"
                value={data.accountNumber}
                onChange={e => update('accountNumber', e.target.value)}
                placeholder="12345678"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">IBAN (optional)</label>
            <input
              type="text"
              value={data.iban}
              onChange={e => update('iban', e.target.value.toUpperCase())}
              placeholder="GB29 NWBK 6016 1331 9268 19"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Save profile
          </button>

          <p className="text-center text-sm text-gray-500">
            Data is saved locally in your browser
          </p>
        </div>
      </div>
    </div>
  );
}
