'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productApi, orderApi, categoryApi, offerApi, reviewApi } from '@/lib/api';
import { Order, Product, Review } from '@/types';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCategories: number;
  activeOffers: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
    activeOffers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [bestSellersCount, setBestSellersCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          productsRes,
          ordersRes,
          categoriesRes,
          offersRes,
          recentOrdersRes,
          lowStockRes,
          bestSellersRes,
          pendingReviewsRes,
        ] = await Promise.all([
          productApi.getAll({ limit: 1 }),
          orderApi.getAll({ limit: 1 }),
          categoryApi.getAll({ limit: 1 }),
          offerApi.getActive(),
          orderApi.getAll({ limit: 5 }),
          productApi.getLowStock(5, 5),
          productApi.getBestSellers(100),
          reviewApi.getAll({ isApproved: false, limit: 1 }),
        ]);

        setStats({
          totalProducts: productsRes.data.pagination?.total || productsRes.data.length || 0,
          totalOrders: ordersRes.data.pagination?.total || ordersRes.data.length || 0,
          totalCategories: categoriesRes.data.pagination?.total || categoriesRes.data.length || 0,
          activeOffers: Array.isArray(offersRes.data) ? offersRes.data.length : 0,
        });

        const recentOrdersData = recentOrdersRes.data.data || recentOrdersRes.data || [];
        setRecentOrders(Array.isArray(recentOrdersData) ? recentOrdersData : []);

        const lowStockData = Array.isArray(lowStockRes.data) ? lowStockRes.data : [];
        setLowStockProducts(lowStockData);

        const bestSellersData = Array.isArray(bestSellersRes.data) ? bestSellersRes.data : [];
        setBestSellersCount(bestSellersData.length);

        const pendingReviewsData = pendingReviewsRes.data;
        setPendingReviewsCount(
          pendingReviewsData.pagination?.total ?? (Array.isArray(pendingReviewsData) ? pendingReviewsData.length : 0),
        );
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      color: 'bg-blue-500',
      href: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'bg-green-500',
      href: '/admin/orders',
    },
    {
      title: 'Total Categories',
      value: stats.totalCategories,
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      color: 'bg-yellow-500',
      href: '/admin/categories',
    },
    {
      title: 'Active Offers',
      value: stats.activeOffers,
      icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
      color: 'bg-purple-500',
      href: '/admin/offers',
    },
    {
      title: 'Best Sellers',
      value: bestSellersCount,
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      color: 'bg-pink-500',
      href: '/admin/products',
    },
    {
      title: 'Pending Reviews',
      value: pendingReviewsCount,
      icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      color: 'bg-orange-500',
      href: '/admin/reviews',
    },
  ];

  const quickActions = [
    { label: 'Add Product', href: '/admin/products/new', icon: 'M12 4v16m8-8H4' },
    { label: 'Add Category', href: '/admin/categories/new', icon: 'M12 4v16m8-8H4' },
    { label: 'Add Offer', href: '/admin/offers/new', icon: 'M12 4v16m8-8H4' },
    { label: 'View Orders', href: '/admin/orders', icon: 'M9 5l7 7-7 7' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome to your admin dashboard. Here is an overview of your store.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isLoading ? (
                        <div className="animate-pulse h-6 w-16 bg-gray-200 rounded"></div>
                      ) : (
                        card.value
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-indigo-600 hover:text-indigo-900">
              View all
            </Link>
          </div>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href="/admin/orders"
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderId}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₹{order.totalAmount?.toFixed(2)}</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Low Stock Alerts</h2>
            <Link href="/admin/products" className="text-sm text-indigo-600 hover:text-indigo-900">
              View all
            </Link>
          </div>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No products are running low on stock.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {lowStockProducts.map((product) => (
                <Link
                  key={product._id}
                  href={`/admin/products/${product._id}/edit`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <span className="text-sm font-medium text-red-600">{product.stock} left</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
