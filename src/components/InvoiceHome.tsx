import { useSubscriptionContext } from '../context/SubscriptionContext';
import SubscriptionBadge from './SubscriptionBadge';

interface InvoiceHomeProps {
  onNavigate: (mode: string) => void;
  onLogout: () => void;
}

export default function InvoiceHome({ onNavigate, onLogout }: InvoiceHomeProps) {
  const { remainingInvoices, isPaid } = useSubscriptionContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧾</span>
            <h1 className="text-xl font-bold text-gray-900">InvoiceSnap</h1>
            <SubscriptionBadge />
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => onNavigate('new-invoice')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:scale-105 hover:bg-blue-700 transition-all"
          >
            + New Invoice
          </button>
          <button
            onClick={() => onNavigate('boris')}
            className="bg-white border-2 border-blue-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-500 transition-all"
          >
            🤖 Ask Boris
          </button>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Create Invoice */}
          <button
            onClick={() => onNavigate('new-invoice')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-left text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
          >
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-lg font-bold mb-1">New Invoice</h3>
            <p className="text-blue-100 text-sm">
              Create a new invoice with all required details
            </p>
            {!isPaid && remainingInvoices < Infinity && (
              <div className="mt-3 bg-blue-500/30 rounded-lg px-3 py-1 text-xs">
                {remainingInvoices} free invoices remaining
              </div>
            )}
          </button>

          {/* Invoice History */}
          <button
            onClick={() => onNavigate('invoice-list')}
            className="bg-white rounded-2xl p-6 text-left shadow-lg hover:shadow-2xl hover:scale-105 transition-all border border-blue-100"
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Invoice List</h3>
            <p className="text-gray-600 text-sm">
              Manage and export all your invoices
            </p>
          </button>

          {/* Boris AI */}
          <button
            onClick={() => onNavigate('boris')}
            className="bg-white rounded-2xl p-6 text-left shadow-lg hover:shadow-2xl hover:scale-105 transition-all border border-blue-100"
          >
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ask Boris</h3>
            <p className="text-gray-600 text-sm">
              AI help with VAT, invoicing and running your business
            </p>
          </button>
        </div>

        {/* Business Hub card */}
        <button
          onClick={() => onNavigate('business-hub')}
          className="w-full bg-gradient-to-r from-blue-50 to-red-50 border-2 border-blue-200 rounded-2xl p-5 text-left mb-6 hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">📊</span>
            <div>
              <h3 className="font-bold text-gray-900">Business Hub</h3>
              <p className="text-sm text-gray-600">Dashboard, reminders & more</p>
            </div>
            <span className="ml-auto text-blue-500 text-xl">→</span>
          </div>
        </button>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => onNavigate('customers')}
            className="bg-white rounded-xl p-4 text-left shadow hover:shadow-md transition-all border border-gray-200 flex items-center gap-3"
          >
            <span className="text-2xl">👥</span>
            <div>
              <div className="font-semibold text-gray-900">Customers</div>
              <div className="text-sm text-gray-500">Customer overview and revenue</div>
            </div>
          </button>
          <button
            onClick={() => onNavigate('time-tracking')}
            className="bg-white rounded-xl p-4 text-left shadow hover:shadow-md transition-all border border-gray-200 flex items-center gap-3"
          >
            <span className="text-2xl">⏱</span>
            <div>
              <div className="font-semibold text-gray-900">Time Tracking</div>
              <div className="text-sm text-gray-500">Working hours and hourly rates</div>
            </div>
          </button>
        </div>

        {/* Bottom Links */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('company-profile')}
            className="bg-white rounded-xl p-4 text-left shadow hover:shadow-md transition-all border border-gray-200 flex items-center gap-3"
          >
            <span className="text-2xl">🏢</span>
            <div>
              <div className="font-semibold text-gray-900">Company Profile</div>
              <div className="text-sm text-gray-500">Edit your business details</div>
            </div>
          </button>
          <button
            onClick={() => onNavigate('pricing')}
            className="bg-white rounded-xl p-4 text-left shadow hover:shadow-md transition-all border border-gray-200 flex items-center gap-3"
          >
            <span className="text-2xl">💎</span>
            <div>
              <div className="font-semibold text-gray-900">Pricing</div>
              <div className="text-sm text-gray-500">Compare plans and upgrade</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
