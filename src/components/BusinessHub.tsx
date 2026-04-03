import { useState } from 'react';
import Dashboard from './Dashboard';
import PaymentReminders from './PaymentReminders';
import ReceiptScanner from './ReceiptScanner';
import RecurringInvoices from './RecurringInvoices';
import VATReturn from './VATReturn';
import EInvoice from './EInvoice';
import TrustScore from './TrustScore';
import BorisChat from './BorisChat';

interface BusinessHubProps {
  onBack: () => void;
  onNavigate: (mode: string) => void;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'reminders', label: 'Reminders', icon: '⚠️' },
  { id: 'receipts', label: 'Receipts', icon: '🧾' },
  { id: 'recurring', label: 'Recurring', icon: '🔄' },
  { id: 'vat', label: 'VAT Return', icon: '🧾' },
  { id: 'einvoice', label: 'E-Invoice', icon: '📄' },
  { id: 'trustscore', label: 'TrustScore', icon: '🛡️' },
  { id: 'boris', label: 'Boris', icon: '🤖' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function BusinessHub({ onBack, onNavigate }: BusinessHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'reminders': return <PaymentReminders />;
      case 'receipts': return <ReceiptScanner />;
      case 'recurring': return <RecurringInvoices />;
      case 'vat': return <VATReturn />;
      case 'einvoice': return <EInvoice />;
      case 'trustscore': return <TrustScore lang="en" />;
      case 'boris': return <BorisChat onBack={() => setActiveTab('dashboard')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-semibold text-sm">← Back</button>
              <h1 className="text-xl font-bold text-gray-900">Business Hub</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('new-invoice')}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                + New Invoice
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1 -mx-4 px-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {renderTab()}
      </div>
    </div>
  );
}
