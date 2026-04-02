import { useSubscriptionContext } from '../context/SubscriptionContext';

export default function SubscriptionBadge() {
  const { plan } = useSubscriptionContext();

  const label = plan === 'FREE' ? 'FREE' : plan;
  const style =
    plan === 'FREE'
      ? 'bg-gray-100 text-gray-600'
      : plan === 'START'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-red-100 text-red-700';

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}
