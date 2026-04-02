import { useSubscriptionContext } from '../context/SubscriptionContext';

interface UpgradePromptProps {
  feature?: string;
  onClose?: () => void;
}

export default function UpgradePrompt({ feature, onClose }: UpgradePromptProps) {
  const { plan, usage, openCheckout } = useSubscriptionContext();

  const isNearLimit = usage && usage.invoices && usage.invoices.limit > 0
    && usage.invoices.used >= usage.invoices.limit - 2;

  const isAtLimit = usage && usage.invoices && usage.invoices.limit > 0
    && usage.invoices.used >= usage.invoices.limit;

  if (!isNearLimit && !feature) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-red-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isAtLimit ? (
            <>
              <h3 className="font-bold text-blue-800 text-sm">Limit reached</h3>
              <p className="text-xs text-blue-700 mt-1">
                You have used all {usage?.invoices?.limit} free invoices this month.
                Upgrade for unlimited invoices.
              </p>
            </>
          ) : isNearLimit ? (
            <>
              <h3 className="font-bold text-blue-800 text-sm">Approaching limit</h3>
              <p className="text-xs text-blue-700 mt-1">
                {(usage?.invoices?.limit || 0) - (usage?.invoices?.used || 0)} invoices remaining this month.
              </p>
            </>
          ) : feature ? (
            <>
              <h3 className="font-bold text-blue-800 text-sm">Pro feature</h3>
              <p className="text-xs text-blue-700 mt-1">
                {feature} is only available on the Pro plan.
              </p>
            </>
          ) : null}

          <div className="flex gap-2 mt-3">
            {plan !== 'START' && (
              <button
                onClick={() => openCheckout?.('START')}
                className="bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-blue-500 transition-colors"
              >
                Start (\u00a34.90/mo)
              </button>
            )}
            <button
              onClick={() => openCheckout?.('PRO')}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all"
            >
              Pro (\u00a39.90/mo)
            </button>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-blue-400 hover:text-blue-600 ml-2">×</button>
        )}
      </div>
    </div>
  );
}
