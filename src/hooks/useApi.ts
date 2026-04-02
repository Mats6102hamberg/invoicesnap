import { API_URL } from '../config';

interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}

export async function apiCall<T = any>(action: string, payload: Record<string, any> = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('session_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json();

  if (!res.ok && !data.error) {
    throw new Error(`API error ${res.status}`);
  }

  return data;
}

// Typed interfaces for invoice CRUD
export interface InvoiceLine {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  vatRate: number;
  lineTotalCents: number;
}

export interface InvoiceCustomer {
  id: string;
  name: string;
  address1?: string;
  zip?: string;
  city?: string;
  vatId?: string;
  orgNumber?: string;
  countryCode?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  currency: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  customerId: string;
  companyId: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  notes: string | null;
  countryCode: string;
  lines: InvoiceLine[];
  customer: InvoiceCustomer;
  createdAt: string;
  updatedAt: string;
}

export const invoiceApi = {
  create: (data: Record<string, any>) =>
    apiCall('invoice.create', { countryCode: 'GB', currency: 'GBP', ...data }),
  list: (filters?: { countryCode?: string; status?: string }) =>
    apiCall('invoice.list', { countryCode: 'GB', ...filters }),
  get: (id: string) => apiCall('invoice.get', { id }),
  update: (id: string, data: Record<string, any>) => apiCall('invoice.update', { id, ...data }),
  delete: (id: string) => apiCall('invoice.delete', { id }),
  pdf: (id: string) => id, // PDF is fetched as a blob separately
};

export const customerApi = {
  upsert: (data: Record<string, any>) => apiCall('customer.upsert', data),
};

export async function downloadInvoicePdf(invoiceId: string, filename: string) {
  const token = localStorage.getItem('session_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'invoice.pdf', id: invoiceId }),
  });

  if (!res.ok) throw new Error('Failed to generate PDF');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
