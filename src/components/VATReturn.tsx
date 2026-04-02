import { useState, useEffect } from 'react';
import { apiCall } from '../hooks/useApi';

function formatGBP(cents: number): string {
  return (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

interface Box {
  label: string;
  base?: number;
  tax?: number;
  amount?: number;
}

interface VATData {
  period: { year: number; quarter: number; start: string; end: string };
  invoiceCount: number;
  receiptCount: number;
  rubrieken: Record<string, Box>;
  summary: {
    totalRevenueCents: number;
    totalOutputVatCents: number;
    totalInputVatCents: number;
    totalExpensesCents: number;
    payableCents: number;
  };
}

const QUARTER_LABELS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

export default function VATReturn() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);
  const [data, setData] = useState<VATData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadVAT = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('tax.ustva', { year, quarter });
      if (res.ok) {
        setData(res as any);
      } else {
        throw new Error(res.error || 'Calculation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error during calculation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVAT();
  }, [year, quarter]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">VAT Return (quarterly)</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quarter</label>
            <select
              value={quarter}
              onChange={e => setQuarter(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
            >
              {QUARTER_LABELS.map((label, i) => (
                <option key={i + 1} value={i + 1}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating VAT Return...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
              <div className="text-xs text-gray-500">Invoices</div>
              <div className="text-xl font-bold text-gray-900">{data.invoiceCount}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
              <div className="text-xs text-gray-500">Receipts</div>
              <div className="text-xl font-bold text-gray-900">{data.receiptCount}</div>
            </div>
          </div>

          {/* VAT Return Boxes */}
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h4 className="font-bold text-gray-900 text-sm">VAT Return Boxes – {QUARTER_LABELS[quarter - 1]} {year}</h4>
            </div>
            <div className="divide-y">
              {/* Box 1 - Output VAT at 20% */}
              {data.rubrieken?.['1a'] && (
                <div className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Box 1 – {data.rubrieken['1a'].label || 'VAT due on sales at 20%'}</div>
                    <div className="text-xs text-gray-500">Net value: {formatGBP(data.rubrieken['1a'].base || 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatGBP(data.rubrieken['1a'].tax || 0)}</div>
                  </div>
                </div>
              )}

              {/* Box 2 - Output VAT at 5% */}
              {data.rubrieken?.['1b'] && (
                <div className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Box 2 – {data.rubrieken['1b'].label || 'VAT due on sales at 5%'}</div>
                    <div className="text-xs text-gray-500">Net value: {formatGBP(data.rubrieken['1b'].base || 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatGBP(data.rubrieken['1b'].tax || 0)}</div>
                  </div>
                </div>
              )}

              {/* Box 3 - Flat rate scheme turnover */}
              {data.rubrieken?.['1e'] && (data.rubrieken['1e'].base || 0) > 0 && (
                <div className="px-6 py-3 flex items-center justify-between bg-gray-50">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Flat rate scheme – {data.rubrieken['1e'].label || 'Turnover under flat rate scheme'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-600">{formatGBP(data.rubrieken['1e'].base || 0)}</div>
                  </div>
                </div>
              )}

              {/* Box 4 - Input VAT */}
              {data.rubrieken?.['5b'] && (
                <div className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Box 4 – {data.rubrieken['5b'].label || 'VAT reclaimed on purchases'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">- {formatGBP(data.rubrieken['5b'].amount || 0)}</div>
                  </div>
                </div>
              )}

              {/* Box 5 - Net VAT to pay/reclaim */}
              <div className={`px-6 py-4 flex items-center justify-between ${
                data.summary.payableCents >= 0 ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <div>
                  <div className="text-sm font-bold text-gray-900">Box 5 – Net VAT</div>
                  <div className="text-xs text-gray-500">
                    {data.summary.payableCents >= 0
                      ? 'VAT owed to HMRC'
                      : 'VAT owed to you by HMRC'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    data.summary.payableCents >= 0 ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {formatGBP(Math.abs(data.summary.payableCents))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HMRC information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <div className="font-semibold mb-1">Submitting to HMRC</div>
            <p className="text-xs">
              Your VAT Return must be submitted digitally through Making Tax Digital (MTD)
              compatible software or via HMRC's online services at gov.uk.
            </p>
            <p className="text-xs mt-1">
              <strong>Deadline:</strong> One calendar month and seven days after the end of the
              VAT period (e.g. Q1 Jan–Mar = due by 7th May).
            </p>
            <p className="text-xs mt-1">
              <strong>Please note:</strong> If you are on the VAT flat rate scheme, you pay a fixed
              percentage of your turnover rather than the difference between output and input VAT.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
