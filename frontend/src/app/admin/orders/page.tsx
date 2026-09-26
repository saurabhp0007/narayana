'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderApi } from '@/lib/api';
import { Order, OrderStatus, PaginatedResponse } from '@/types';
import {
  ORDER_STATUS_OPTIONS,
  allowedNextStatuses,
  confirmStatusChange,
  orderCustomerName,
  orderStatusColor,
  orderStatusLabel,
} from '@/lib/orderStatus';

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending: { label: 'Awaiting payment', className: 'bg-orange-100 text-orange-800' },
  failed: { label: 'Payment failed', className: 'bg-red-100 text-red-800' },
  not_required: { label: 'Collect on delivery', className: 'bg-gray-100 text-gray-600' },
};

const orderHref = (order: Order) => `/admin/orders/${encodeURIComponent(order.orderId)}`;

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  packedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export default function OrderManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10;

  // Update status
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (search) params.search = search;

      const response = await orderApi.getAll(params);
      const data = response.data as PaginatedResponse<Order> | Order[];

      if ('pagination' in data) {
        setOrders(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalOrders(data.pagination.total);
      } else {
        setOrders(data);
        setTotalPages(1);
        setTotalOrders(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await orderApi.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleStatusUpdate = async (order: Order, newStatus: OrderStatus) => {
    if (!confirmStatusChange(order.orderId, newStatus)) return;

    setUpdatingOrderId(order._id);
    try {
      await orderApi.updateStatus(order._id, newStatus);
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error('Failed to update order status:', err);
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to update order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage customer orders. {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} found.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-red-500">&times;</span>
          </button>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3 mb-6">
          <div className="bg-white shadow rounded-lg p-4 min-w-0">
            <div className="text-sm font-medium text-gray-500">Total Orders</div>
            <div className="text-xl sm:text-2xl font-bold truncate text-gray-900">{stats.totalOrders}</div>
          </div>
          <div className="col-span-2 sm:col-span-1 xl:col-span-2 bg-white shadow rounded-lg p-4 min-w-0">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 break-all" title={formatCurrency(stats.totalRevenue)}>
              ₹{Math.round(stats.totalRevenue).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 min-w-0">
            <div className="text-sm font-medium text-gray-500">Pending</div>
            <div className="text-xl sm:text-2xl font-bold truncate text-yellow-600">{stats.pendingOrders}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 min-w-0">
            <div className="text-sm font-medium text-gray-500">Processing</div>
            <div className="text-xl sm:text-2xl font-bold truncate text-amber-600">{stats.processingOrders}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 min-w-0">
            <div className="text-sm font-medium text-gray-500">Packed</div>
            <div className="text-xl sm:text-2xl font-bold truncate text-indigo-600">{stats.packedOrders}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 min-w-0">
            <div className="text-sm font-medium text-gray-500">Delivered</div>
            <div className="text-xl sm:text-2xl font-bold truncate text-green-600">{stats.deliveredOrders}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="search"
              id="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Order ID, name, phone…"
              title="Search by order ID, customer name, email or phone"
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        {(statusFilter || fromDate || toDate || searchInput) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchInput('');
                setFromDate('');
                setToDate('');
                setCurrentPage(1);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-900"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="hidden lg:grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,1fr)_1.5rem] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div>Order</div>
          <div>Customer</div>
          <div>Products</div>
          <div>Total</div>
          <div>Status</div>
          <div />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No orders found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => {
              const name = orderCustomerName(order) || order.contactEmail || 'N/A';
              const payment = PAYMENT_BADGE[order.paymentStatus || 'not_required'];
              const nextStatuses = allowedNextStatuses(order.status);
              const thumbnails = order.items.filter((item) => item.images?.[0]).slice(0, 3);
              return (
                <li
                  key={order._id}
                  onClick={() => router.push(orderHref(order))}
                  className="grid grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,1fr)_1.5rem] gap-x-4 gap-y-3 px-4 py-4 cursor-pointer hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <Link
                      href={orderHref(order)}
                      onClick={(e) => e.stopPropagation()}
                      className="block text-sm font-medium text-indigo-600 hover:text-indigo-900 break-all"
                    >
                      {order.orderId}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="min-w-0 text-right lg:text-left">
                    <p className="text-sm text-gray-900 truncate" title={name}>
                      {name}
                      {!order.userId && <span className="ml-1 text-xs text-gray-400">(guest)</span>}
                    </p>
                    {order.contactPhone && <p className="text-xs text-gray-500 truncate">{order.contactPhone}</p>}
                    {orderCustomerName(order) && order.contactEmail && (
                      <p className="text-xs text-gray-500 truncate" title={order.contactEmail}>
                        {order.contactEmail}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-1 min-w-0 flex items-center gap-3">
                    {thumbnails.length > 0 && (
                      <div className="flex -space-x-3 shrink-0">
                        {thumbnails.map((item, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={item.images[0]}
                            alt=""
                            className="h-10 w-10 rounded-md border-2 border-white object-cover bg-gray-100"
                          />
                        ))}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate" title={order.items.map((i) => i.productName).join(', ')}>
                        {order.items[0]?.productName}
                        {order.items.length > 1 && (
                          <span className="text-gray-500"> +{order.items.length - 1} more</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                        {order.items[0]?.size && ` · Size ${order.items[0].size}`}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{order.paymentMethod === 'payu' ? 'Online' : 'COD'}</p>
                  </div>

                  <div className="min-w-0 flex flex-col items-end lg:items-start gap-1" onClick={(e) => e.stopPropagation()}>
                    {nextStatuses.length > 0 ? (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order, e.target.value as OrderStatus)}
                        disabled={updatingOrderId === order._id}
                        aria-label={`Status for ${order.orderId}`}
                        className={`max-w-full text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${orderStatusColor(
                          order.status
                        )} ${updatingOrderId === order._id ? 'opacity-50' : ''}`}
                      >
                        {[order.status, ...nextStatuses].map((s) => (
                          <option key={s} value={s}>
                            {orderStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex text-xs font-semibold rounded-full px-2 py-1 ${orderStatusColor(order.status)}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                    )}
                    <span className={`inline-flex text-[10px] font-medium rounded px-1.5 py-0.5 ${payment.className}`}>
                      {payment.label}
                    </span>
                  </div>

                  <div className="hidden lg:flex items-center justify-end text-gray-400" aria-hidden>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
            <nav className="inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : currentPage - 2 + i;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`hidden sm:inline-flex px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'relative z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
