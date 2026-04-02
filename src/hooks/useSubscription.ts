import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

type PlanType = 'FREE' | 'START' | 'PRO';

interface UsageInfo {
  used: number;
  limit: number;
}

interface Features {
  showBranding: boolean;
  invoiceList: boolean;
  invoiceStatus: boolean;
  ocr: boolean;
  multiVat: boolean;
  vatReport: boolean;
  bookkeepingExport: boolean;
}

interface SubscriptionData {
  plan: PlanType;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  usage: {
    invoices: UsageInfo;
    boris: UsageInfo;
  };
  features: Features;
}

export interface UseSubscriptionReturn {
  loading: boolean;
  plan: PlanType;
  /** Display label, e.g. "Free", "Start \u00a34.90/mo", "Pro \u00a39.90/mo" */
  planLabel: string;
  isPaid: boolean;
  isPro: boolean;
  canCreateInvoice: boolean;
  canAskBoris: boolean;
  remainingInvoices: number;
  remainingBoris: number;
  features: Features;
  usage: SubscriptionData['usage'] | null;
  cancelAtPeriodEnd: boolean;
  refresh: () => Promise<void>;
  openCheckout: (plan?: 'START' | 'PRO') => Promise<void>;
  openPortal: () => Promise<void>;
}

async function apiCall(action: string, body?: Record<string, unknown>) {
  const token = localStorage.getItem('session_token');
  const response = await fetch(`${API_URL}/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...body }),
  });
  return response.json();
}

const DEFAULT_FEATURES: Features = {
  showBranding: true,
  invoiceList: false,
  invoiceStatus: false,
  ocr: false,
  multiVat: false,
  vatReport: false,
  bookkeepingExport: false,
};

const PLAN_LABELS: Record<PlanType, string> = {
  FREE: 'Free',
  START: 'Start \u00a34.90/mo',
  PRO: 'Pro \u00a39.90/mo',
};

export function useSubscription(): UseSubscriptionReturn {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) { setLoading(false); return; }

      const result = await apiCall('subscription.status');
      if (result.ok) {
        setData({
          plan: result.plan,
          status: result.status,
          cancelAtPeriodEnd: result.cancelAtPeriodEnd,
          currentPeriodEnd: result.currentPeriodEnd,
          usage: result.usage,
          features: result.features,
        });
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const plan = data?.plan ?? 'FREE';
  const isPaid = plan === 'START' || plan === 'PRO';
  const isPro = plan === 'PRO';
  const usage = data?.usage ?? null;

  const invoiceLimit = usage?.invoices?.limit ?? 5;
  const borisLimit = usage?.boris?.limit ?? 5;
  const canCreateInvoice = isPaid || (usage?.invoices?.used ?? 0) < invoiceLimit;
  const canAskBoris = (usage?.boris?.used ?? 0) < borisLimit;

  const remainingInvoices = isPaid
    ? Infinity
    : Math.max(0, invoiceLimit - (usage?.invoices?.used ?? 0));
  const remainingBoris = isPro
    ? Infinity
    : Math.max(0, borisLimit - (usage?.boris?.used ?? 0));

  const features = data?.features ?? DEFAULT_FEATURES;

  const openCheckout = async (targetPlan: 'START' | 'PRO' = 'START') => {
    try {
      const result = await apiCall('stripe.create_checkout', { plan: targetPlan });
      if (result.ok && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Checkout error:', result.error);
      }
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  };

  const openPortal = async () => {
    try {
      const result = await apiCall('stripe.portal');
      if (result.ok && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Portal error:', result.error);
      }
    } catch (error) {
      console.error('Failed to open subscription portal:', error);
    }
  };

  return {
    loading, plan,
    planLabel: PLAN_LABELS[plan],
    isPaid, isPro,
    canCreateInvoice, canAskBoris,
    remainingInvoices, remainingBoris,
    features, usage,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
    refresh: loadStatus,
    openCheckout, openPortal,
  };
}
