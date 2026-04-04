interface WelcomeScreenProps {
  onNavigate: (mode: string) => void;
}

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">

      {/* Compliance Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center gap-3 text-sm">
          <span className="text-lg">🏛️</span>
          <span className="font-semibold">MTD compliant</span>
          <span className="hidden md:inline">–</span>
          <span className="hidden md:inline">InvoiceSnap meets HMRC Making Tax Digital requirements for VAT</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold ml-2">HMRC</span>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🧾</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">InvoiceSnap</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create invoices in 60 seconds – VAT compliant and ready for e-invoicing. Simple, fast and affordable.
        </p>
        <button
          onClick={() => onNavigate('invoice-home')}
          className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl hover:scale-105 hover:bg-blue-700 transition-all"
        >
          Get started free
        </button>
      </div>

      {/* Compliance Box */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-red-50 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🏛️</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Compliant with UK legislation</h2>
                <p className="text-sm text-blue-700">HMRC Making Tax Digital & e-invoicing standards</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg mt-0.5">✓</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">VAT Return support</div>
                  <p className="text-xs text-gray-600">All VAT rates (20% / 5% / 0%) correctly calculated and displayed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg mt-0.5">✓</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Companies House registration</div>
                  <p className="text-xs text-gray-600">Company number and VAT number on every invoice as required by law</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg mt-0.5">✓</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">VAT flat rate scheme</div>
                  <p className="text-xs text-gray-600">Automatic notation and correct calculation for flat rate VAT scheme businesses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg mt-0.5">✓</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Sequential invoice numbers</div>
                  <p className="text-xs text-gray-600">Unique, consecutive numbering as required by HMRC</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg mt-0.5">✓</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Boris AI assistant</div>
                  <p className="text-xs text-gray-600">AI help with questions about VAT, invoicing and running your business</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg mt-0.5">✓</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">E-invoicing ready</div>
                  <p className="text-xs text-gray-600">Ready for electronic invoicing to UK and international standards</p>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <div className="text-sm">
                  <span className="font-semibold text-blue-900">Please note:</span>
                  <span className="text-blue-800"> All invoices comply with HMRC requirements. InvoiceSnap supports both VAT-registered businesses and the VAT flat rate scheme.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Invoice in 60 seconds</h3>
            <p className="text-gray-600">
              Enter your company details once, then create invoices in a flash.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Boris helps you</h3>
            <p className="text-gray-600">
              Our AI assistant answers your questions about VAT and invoicing.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">HMRC compliant</h3>
            <p className="text-gray-600">
              All required details on the invoice. Ready for e-invoicing.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-blue-50 to-red-50 border border-blue-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick start</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('new-invoice')}
              className="bg-white border-2 border-blue-300 rounded-xl p-4 text-left hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-semibold text-gray-900">Create invoice</div>
              <div className="text-sm text-gray-600">New invoice in just a few steps</div>
            </button>
            <button
              onClick={() => onNavigate('boris')}
              className="bg-white border-2 border-blue-300 rounded-xl p-4 text-left hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold text-gray-900">Ask Boris</div>
              <div className="text-sm text-gray-600">AI help with VAT and invoicing</div>
            </button>
            <button
              onClick={() => onNavigate('invoice-list')}
              className="bg-white border-2 border-blue-300 rounded-xl p-4 text-left hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold text-gray-900">Invoice list</div>
              <div className="text-sm text-gray-600">View all your invoices at a glance</div>
            </button>
            <button
              onClick={() => onNavigate('company-profile')}
              className="bg-white border-2 border-blue-300 rounded-xl p-4 text-left hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">🏢</div>
              <div className="font-semibold text-gray-900">Company profile</div>
              <div className="text-sm text-gray-600">Manage your business details</div>
            </button>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="max-w-3xl mx-auto px-4 pb-16 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-lg text-gray-700 italic mb-4">
            "Finally a straightforward solution for invoices. No expensive subscription, no complexity – exactly what I need as a sole trader."
          </p>
          <p className="text-sm text-gray-500">– Satisfied user</p>
        </div>
      </div>

      {/* TrustScore Teaser */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
          <span className="text-3xl">🛡️</span>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">TrustScore</h3>
            <p className="text-sm text-gray-600">Build your payment reliability score. Other InvoiceSnap users can see your rating and choose to do business with you.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 pb-8 text-center space-y-2">
        <button
          onClick={() => onNavigate('pricing')}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          View pricing →
        </button>
        <p className="text-xs text-gray-400">
          InvoiceSnap – E-invoicing ready | VAT compliant | Companies House | MTD for VAT
        </p>
      </div>
    </div>
  );
}
