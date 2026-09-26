'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { orderApi } from '@/lib/api';
import { printOrderReceipt } from '@/lib/receipt';
import { ORDER_STATUS_OPTIONS, customerOrderStatusLabel, orderStatusColor } from '@/lib/orderStatus';
import { Order } from '@/types';

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const { userType } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (userType) {
      fetchOrders();
    }
  }, [userType, currentPage, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: { page: number; limit: number; status?: string } = {
        page: currentPage,
        limit: 10,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await orderApi.getMyOrders(params);
      const data = response.data;

      // Handle both paginated and non-paginated responses
      if (Array.isArray(data)) {
        setOrders(data);
        setPagination(null);
      } else if (data.data) {
        setOrders(data.data);
        setPagination(data.pagination || null);
      } else if (data.orders) {
        setOrders(data.orders);
        setPagination(data.pagination || null);
      } else {
        setOrders([]);
        setPagination(null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = orderStatusColor;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your orders</h2>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Orders</option>
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {customerOrderStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {statusFilter ? 'No orders match the selected filter.' : 'You haven\'t placed any orders yet.'}
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="text-lg font-medium text-gray-900">{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {customerOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-lg font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => printOrderReceipt(order)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Print Receipt
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Items ({order.totalItems})</h4>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="shrink-0 w-16 h-16 relative">
                          {item.images && item.images[0] ? (
                            <Image
                              src={item.images[0]}
                              alt={item.productName}
                              fill
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <h5 className="text-sm font-medium text-gray-900">{item.productName}</h5>
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          {item.discountPrice ? (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                ₹{(item.discountPrice * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 line-through">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-end space-x-8">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="text-sm font-medium text-gray-900">₹{order.subtotal.toFixed(2)}</p>
                    </div>
                    {order.discount > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Discount</p>
                        <p className="text-sm font-medium text-green-600">-₹{order.discount.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-lg font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(order.shippingAddress || order.contactEmail || order.contactPhone || order.notes) && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {order.shippingAddress && (
                        <div>
                          <p className="text-gray-500">Shipping Address</p>
                          <p className="text-gray-900">{order.shippingAddress}</p>
                        </div>
                      )}
                      {order.contactEmail && (
                        <div>
                          <p className="text-gray-500">Contact Email</p>
                          <p className="text-gray-900">{order.contactEmail}</p>
                        </div>
                      )}
                      {order.contactPhone && (
                        <div>
                          <p className="text-gray-500">Contact Phone</p>
                          <p className="text-gray-900">{order.contactPhone}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div>
                          <p className="text-gray-500">Notes</p>
                          <p className="text-gray-900">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}

            {/* Pagination Info */}
            {pagination && (
              <div className="text-center text-sm text-gray-500 mt-4">
                Showing {orders.length} of {pagination.total} orders (Page {pagination.page} of {pagination.totalPages})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
