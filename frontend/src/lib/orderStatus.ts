import { OrderStatus } from '@/types';

// Mirrors the backend rules in order.schema.ts: forward only, cancellable until shipped.
const FULFILMENT_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
];
const CANCELLABLE = FULFILMENT_FLOW.slice(0, FULFILMENT_FLOW.indexOf('shipped'));

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [...FULFILMENT_FLOW, 'cancelled'];

export const allowedNextStatuses = (current: string): OrderStatus[] => {
  const step = FULFILMENT_FLOW.indexOf(current as OrderStatus);
  if (step === -1) return [];
  const next = FULFILMENT_FLOW.slice(step + 1);
  return CANCELLABLE.includes(current as OrderStatus) ? [...next, 'cancelled'] : next;
};

export const orderStatusLabel = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const customerOrderStatusLabel = (status: string): string =>
  status === 'pending' ? 'Order Placed' : orderStatusLabel(status);

export const ORDER_STATUS_COLORS: Record<string, string> = {
  payment_pending: 'bg-orange-100 text-orange-800',
  payment_failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-amber-100 text-amber-800',
  packed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const orderStatusColor = (status: string): string =>
  ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
