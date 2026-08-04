'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';

export default function CartPage() {
  const router = useRouter();
  const { items, summary, isLoading, error, fetchCart, updateQuantity, removeFromCart, clearCart, clearError } = useCartStore();
  const { userType, user } = useAuthStore();
  const { guestId, initGuestSession } = useGuestStore();
  const [currentGuestId, setCurrentGuestId] = useState<string | null>(null);

  useEffect(() => {
    const initCart = async () => {
      if (userType === 'user' && user) {
        // Logged in user - fetch from database
        fetchCart();
      } else {
        // Guest user - fetch from Redis
        let gId = guestId;
        if (!gId) {
          gId = await initGuestSession();
        }
        setCurrentGuestId(gId);
        fetchCart(gId);
      }
    };
    initCart();
  }, [fetchCart, userType, user, guestId, initGuestSession]);

  const calculateTotal = () => {
    if (summary) {
      return summary.total;
    }
    return items.reduce((total, item) => {
      return total + (item.itemTotal || item.price * item.quantity);
    }, 0);
  };

  const getSubtotal = () => {
    if (summary) {
      return summary.subtotal;
    }
    return items.reduce((total, item) => {
      return total + (item.itemSubtotal || item.price * item.quantity);
    }, 0);
  };

  const getTotalDiscount = () => {
    return summary?.totalDiscount || 0;
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const gId:any = userType === 'user' && user ? undefined : currentGuestId;
      await updateQuantity(itemId, newQuantity, gId);
    } catch {
      // Error handled by store
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const gId:any = userType === 'user' && user ? undefined : currentGuestId;
      await removeFromCart(itemId, gId);
    } catch {
      // Error handled by store
    }
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      try {
        const gId = userType === 'user' && user ? undefined : currentGuestId;
        await clearCart(gId);
      } catch {
        // Error handled by store
      }
    }
  };

  const handleProceedToCheckout = async () => {
    // Redirect to unified checkout page for both logged-in and guest users
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && items.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-2 text-sm text-gray-500">Start adding some products to your cart.</p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8">
              <div className="bg-white shadow rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {items?.map((item) => (
                    <li key={item._id} className="p-6">
                      <div className="flex items-center">
                        <div className="shrink-0 w-24 h-24 relative">
                          {item?.product?.images && item?.product?.images[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-6 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{item?.product?.name}</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                SKU: {item?.product?.sku}
                                {item?.size && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    Size: {item.size}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              {item?.product?.discountPrice ? (
                                <>
                                  <p className="text-lg font-medium text-gray-900">
                                    ₹{item.product.discountPrice.toFixed(2)}
                                  </p>
                                  <p className="text-sm text-gray-500 line-through">
                                    ₹{item.product.price.toFixed(2)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-lg font-medium text-gray-900">
                                  ₹{item.price.toFixed(2)}
                                </p>
                              )}
                              {(item.productDiscount > 0 || item.offerDiscount > 0) && (
                                <p className="text-sm text-green-600">
                                  Save ₹{(item.productDiscount + item.offerDiscount).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <button
                                onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                disabled={isLoading || item.quantity <= 1}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="mx-4 text-gray-900 font-medium">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                disabled={isLoading}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                Subtotal: ₹{item.itemTotal.toFixed(2)}
                              </p>
                              <button
                                onClick={() => handleRemoveItem(item._id)}
                                disabled={isLoading}
                                className="text-red-600 hover:text-red-500 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleClearCart}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-500 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Subtotal ({summary?.itemCount || items.length} items)</p>
                    <p className="text-sm font-medium text-gray-900">₹{getSubtotal().toFixed(2)}</p>
                  </div>
                  {getTotalDiscount() > 0 && (
                    <div className="flex justify-between">
                      <p className="text-sm text-green-600">Total Discount</p>
                      <p className="text-sm font-medium text-green-600">-₹{getTotalDiscount().toFixed(2)}</p>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <p className="text-base font-medium text-gray-900">Total</p>
                      <p className="text-base font-medium text-gray-900">₹{calculateTotal().toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
