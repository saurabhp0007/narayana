'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { orderApi } from '@/lib/api';
import { printOrderReceipt } from '@/lib/receipt';
import {
  allowedNextStatuses,
  confirmStatusChange,
  orderCustomerName,
  orderStatusColor,
  orderStatusLabel,
} from '@/lib/orderStatus';
import { Order, OrderCustomerRef, OrderItem, OrderProductRef, OrderStatus } from '@/types';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: 'Cash on Delivery',
  payu: 'Online (PayU)',
};

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending: { label: 'Awaiting payment', className: 'bg-orange-100 text-orange-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  not_required: { label: 'Collect on delivery', className: 'bg-gray-100 text-gray-700' },
};

const formatCurrency = (amount = 0) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

const productRef = (item: OrderItem): OrderProductRef | null =>
  item.productId && typeof item.productId === 'object' ? item.productId : null;

const productIdOf = (item: OrderItem): string | null =>
  typeof item.productId === 'string' ? item.productId : (productRef(item)?._id ?? null);

const unitPrice = (item: OrderItem) =>
  item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white shadow rounded-lg p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="min-w-0 text-gray-900 text-right [overflow-wrap:anywhere]">{children}</span>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async () => {
    setError(null);
    try {
      const { data } = await orderApi.getByOrderId(decodeURIComponent(orderId));
      setOrder(data);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 404 ? 'Order not found.' : 'Failed to load this order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order || !confirmStatusChange(order.orderId, status)) return;
    setIsUpdating(true);
    setError(null);
    try {
      await orderApi.updateStatus(order._id, status);
      await fetchOrder();
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyAddress = async () => {
    if (!order?.shippingAddress) return;
    try {
      await navigator.clipboard.writeText(
        [order.customerName, order.shippingAddress, order.contactPhone].filter(Boolean).join('\n'),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the address.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-700">{error}</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-900">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const customer = order.userId && typeof order.userId === 'object' ? (order.userId as OrderCustomerRef) : null;
  const isGuest = !order.userId;
  const nextStatuses = allowedNextStatuses(order.status);
  const payment = PAYMENT_STATUS[order.paymentStatus || 'not_required'];
  const itemsSavings = order.items.reduce(
    (sum, item) => sum + (item.price - unitPrice(item)) * item.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-indigo-600 hover:text-indigo-900">
          ← Back to orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 break-all">{order.orderId}</h1>
            <p className="text-sm text-gray-500">Placed {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${orderStatusColor(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
            {nextStatuses.length > 0 && (
              <select
                value=""
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="" disabled>
                  {isUpdating ? 'Updating…' : 'Change status…'}
                </option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => printOrderReceipt(order)}
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title={`Products (${order.totalItems} ${order.totalItems === 1 ? 'item' : 'items'})`}>
            <ul className="divide-y divide-gray-100">
              {order.items.map((item, index) => {
                const product = productRef(item);
                const productId = productIdOf(item);
                const image = item.images?.[0] || product?.images?.[0];
                const unit = unitPrice(item);
                const removed = typeof item.productId !== 'string' && !product;
                return (
                  <li key={`${productId ?? index}-${item.size ?? ''}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          {productId && !removed ? (
                            <Link
                              href={`/products/${productId}`}
                              target="_blank"
                              className="font-medium text-gray-900 hover:text-indigo-600"
                            >
                              {item.productName}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900">{item.productName}</span>
                          )}
                          {removed && (
                            <span className="ml-2 text-xs rounded bg-red-50 px-1.5 py-0.5 text-red-700">
                              Product deleted
                            </span>
                          )}
                          {product && !product.isActive && (
                            <span className="ml-2 text-xs rounded bg-yellow-50 px-1.5 py-0.5 text-yellow-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">{formatCurrency(unit * item.quantity)}</p>
                      </div>
                      <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 [&>div]:whitespace-nowrap">
                        <div>
                          <dt className="inline text-gray-400">SKU </dt>
                          <dd className="inline">{item.sku}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Size </dt>
                          <dd className="inline font-medium text-gray-900">{item.size || '—'}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Qty </dt>
                          <dd className="inline font-medium text-gray-900">{item.quantity}</dd>
                        </div>
                        <div>
                          <dt className="inline text-gray-400">Price </dt>
                          <dd className="inline">
                            {formatCurrency(unit)}
                            {unit < item.price && (
                              <span className="ml-1 text-gray-400 line-through">{formatCurrency(item.price)}</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-gray-100 pt-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.discount === 0 && itemsSavings > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Savings</span>
                  <span>-{formatCurrency(itemsSavings)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {order.notes && (
            <Card title="Customer Notes">
              <p className="text-sm text-gray-900 whitespace-pre-line">{order.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <Field label="Name">{orderCustomerName(order) || '—'}</Field>
            <Field label="Type">{isGuest ? 'Guest checkout' : 'Registered customer'}</Field>
            {customer?.email && <Field label="Account">{customer.email}</Field>}
            <Field label="Email">
              {order.contactEmail ? (
                <a href={`mailto:${order.contactEmail}`} className="text-indigo-600 hover:text-indigo-900">
                  {order.contactEmail}
                </a>
              ) : (
                '—'
              )}
            </Field>
            <Field label="Phone">
              {order.contactPhone ? (
                <a href={`tel:${order.contactPhone}`} className="text-indigo-600 hover:text-indigo-900">
                  {order.contactPhone}
                </a>
              ) : (
                '—'
              )}
            </Field>
          </Card>

          <Card title="Shipping Address">
            {order.shippingAddress ? (
              <>
                <p className="text-sm text-gray-900 whitespace-pre-line">{order.shippingAddress}</p>
                <button onClick={copyAddress} className="mt-3 text-sm text-indigo-600 hover:text-indigo-900">
                  {copied ? 'Copied ✓' : 'Copy address'}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">Not provided</p>
            )}
          </Card>

          <Card title="Payment">
            <Field label="Method">{PAYMENT_METHOD_LABEL[order.paymentMethod || 'cod']}</Field>
            <Field label="Status">
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${payment.className}`}>
                {payment.label}
              </span>
            </Field>
            {order.txnid && <Field label="Transaction ID">{order.txnid}</Field>}
            {order.paidAt && <Field label="Paid on">{formatDate(order.paidAt)}</Field>}
            <Field label="Amount">{formatCurrency(order.totalAmount)}</Field>
          </Card>

          <Card title="Timeline">
            <Field label="Placed">{formatDate(order.createdAt)}</Field>
            {order.paidAt && <Field label="Paid">{formatDate(order.paidAt)}</Field>}
            <Field label="Last updated">{formatDate(order.updatedAt)}</Field>
          </Card>
        </div>
      </div>
    </div>
  );
}
