import { useSubscriptionContext } from '../context/SubscriptionContext';

export default function PricingPage({ onBack }: { onBack: () => void }) {
  const { plan, openCheckout, openPortal } = useSubscriptionContext();

  const plans = [
    {
      name: 'Free',
      price: '\u00a30',
      period: '',
      features: ['5 invoices per month', '5 Boris questions per month', 'InvoiceSnap branding on invoice', 'Basic invoicing'],
      current: plan === 'FREE',
      action: null,
    },
    {
      name: 'Start',
      price: '\u00a34.90',
      period: '/month',
      features: ['Unlimited invoices', '50 Boris questions per month', 'No branding on invoice', 'Invoice list & status tracking', 'PDF download'],
      current: plan === 'START',
      action: () => openCheckout?.('START'),
      popular: true,
    },
    {
      name: 'Pro',
      price: '\u00a39.90',
      period: '/month',
      features: ['Everything in Start', 'Unlimited Boris', 'E-invoicing (UBL)', 'VAT Return export', 'Bookkeeping export', 'Priority support'],
      current: plan === 'PRO',
      action: () => openCheckout?.('PRO'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-semibold text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Pricing & Subscription</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((p, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-lg p-6 border-2 relative ${
              p.popular ? 'border-blue-500' : p.current ? 'border-green-400' : 'border-gray-100'
            }`}>
              {p.popular && !p.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Popular
                </div>
              )}
              {p.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Current plan
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {p.price}<span className="text-sm font-normal text-gray-500">{p.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              {p.current ? (
                <button
                  onClick={() => openPortal?.()}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200"
                >
                  Manage
                </button>
              ) : p.action ? (
                <button
                  onClick={p.action}
                  className={`w-full py-2 rounded-xl text-sm font-semibold ${
                    p.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Upgrade
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {plan !== 'FREE' && (
          <div className="text-center">
            <button onClick={() => openPortal?.()} className="text-sm text-gray-500 hover:text-gray-700">
              Manage subscription via Stripe →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
