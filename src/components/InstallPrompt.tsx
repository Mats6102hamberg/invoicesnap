import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) return;

    // Check if recently dismissed (7 days)
    const dismissedAt = localStorage.getItem('is_install_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('is_install_dismissed', String(Date.now()));
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosGuide(false);
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !showIosGuide) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📱</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Install InvoiceSnap</h3>
            {showIosGuide ? (
              <p className="text-xs text-gray-600 mt-1">
                Tap <span className="font-semibold">Share</span> (⬆️) then <span className="font-semibold">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="text-xs text-gray-600 mt-1">
                Quick access to your invoices straight from your home screen.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            Install now
          </button>
        )}
      </div>
    </div>
  );
}
