'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';
import { useToastStore } from '@/store/toastStore';
import { CartItem } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const { items, summary, isLoading, error, fetchCart, updateQuantity, removeFromCart, clearCart, clearError } = useCartStore();
  const { userType, user } = useAuthStore();
  const { guestId, initGuestSession } = useGuestStore();
  const showToast = useToastStore((s) => s.show);
  const [currentGuestId, setCurrentGuestId] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

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

  const itemKey = (item: CartItem) => item._id || `${item.product._id}-${item.size || 'nosize'}`;

  // Both store actions take (itemId, ..., productId, guestId, size) — for a guest cart
  // the item has no Mongo `_id` at all (guest items live in Redis, keyed by
  // productId+size), so productId/guestId/size are what actually identify the line;
  // itemId is only meaningful for the logged-in path. Passing the wrong positional slot
  // here previously left guestId unset, which silently fell through to the logged-in
  // deletion path with an undefined itemId and crashed the backend with a CastError.
  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    setPendingKey(itemKey(item));
    try {
      const gId = userType === 'user' && user ? undefined : currentGuestId;
      await updateQuantity(item._id, newQuantity, item.product._id, gId, item.size);
    } catch {
      // Error handled by store
    } finally {
      setPendingKey(null);
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    setPendingKey(itemKey(item));
    try {
      const gId = userType === 'user' && user ? undefined : currentGuestId;
      await removeFromCart(item._id, item.product._id, gId, item.size);
      showToast(item.product?.name ? `Removed ${item.product.name} from cart` : 'Item removed from cart', 'info');
    } catch {
      // Error handled by store
    } finally {
      setPendingKey(null);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      try {
        const gId = userType === 'user' && user ? undefined : currentGuestId;
        await clearCart(gId);
        showToast('Cart cleared', 'info');
      } catch {
        // Error handled by store
      }
    }
  };

  const handleProceedToCheckout = async () => {
    // Redirect to unified checkout page for both logged-in and guest users
    router.push('/checkout');
  };

  const itemCount = summary?.itemCount ?? items.length;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-gray-900">
            Shopping Cart
          </h1>
          {items.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg bg-red-50 border border-red-100 p-4 mb-6"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={clearError}
                  className="text-sm text-red-600 hover:text-red-500 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && items.length === 0 ? (
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Loading your cart...</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl border border-gray-200"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1.5 text-sm text-gray-500">Start adding some products to your cart.</p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  <AnimatePresence initial={false}>
                    {items?.map((item) => {
                      const key = itemKey(item);
                      const isPending = pendingKey === key && isLoading;
                      return (
                        <motion.li
                          key={key}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isPending ? 0.6 : 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-5 sm:p-6"
                        >
                          <div className="flex gap-4 sm:gap-6">
                            <Link
                              href={`/products/${item.product?._id ?? ''}`}
                              className="shrink-0 w-20 h-24 sm:w-24 sm:h-28 relative rounded-lg overflow-hidden bg-gray-50"
                            >
                              {item?.product?.images && item?.product?.images[0] ? (
                                <Image
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  fill
                                  className="object-contain p-1.5"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between gap-3">
                                <div className="min-w-0">
                                  <Link href={`/products/${item.product?._id ?? ''}`}>
                                    <h3 className="text-sm sm:text-base font-medium text-gray-900 hover:text-gray-600 transition-colors line-clamp-2">
                                      {item?.product?.name}
                                    </h3>
                                  </Link>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-gray-400">SKU: {item?.product?.sku}</span>
                                    {item?.size && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        Size {item.size}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {item?.product?.discountPrice ? (
                                    <>
                                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                                        ₹{item.product.discountPrice.toFixed(2)}
                                      </p>
                                      <p className="text-xs text-gray-400 line-through">
                                        ₹{item.product.price.toFixed(2)}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                                      ₹{item.price.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between">
                                <div className="inline-flex items-center rounded-full border border-gray-200">
                                  <button
                                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                    disabled={isLoading || item.quantity <= 1}
                                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <svg className="h-3.5 w-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <span className="w-8 text-center text-sm font-medium text-gray-900 tabular-nums">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                    disabled={isLoading}
                                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-50 disabled:opacity-30 transition-colors"
                                    aria-label="Increase quantity"
                                  >
                                    <svg className="h-3.5 w-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>

                                <div className="flex items-center gap-4">
                                  {(item.productDiscount > 0 || item.offerDiscount > 0) && (
                                    <span className="text-xs font-medium text-accent-700 bg-accent-50 px-2 py-1 rounded-full">
                                      Saved ₹{(item.productDiscount + item.offerDiscount).toFixed(2)}
                                    </span>
                                  )}
                                  <p className="hidden sm:block text-sm font-medium text-gray-900 tabular-nums">
                                    ₹{item.itemTotal.toFixed(2)}
                                  </p>
                                  <button
                                    onClick={() => handleRemoveItem(item)}
                                    disabled={isLoading}
                                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                                    aria-label="Remove item"
                                    title="Remove"
                                  >
                                    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="mt-2 sm:hidden text-sm font-medium text-gray-900 text-right tabular-nums">
                                ₹{item.itemTotal.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  ← Continue Shopping
                </Link>
                <button
                  onClick={handleClearCart}
                  disabled={isLoading}
                  className="text-sm font-medium text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:sticky lg:top-24">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                <div className="mt-6 space-y-3.5">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</p>
                    <p className="text-sm font-medium text-gray-900 tabular-nums">₹{getSubtotal().toFixed(2)}</p>
                  </div>
                  {getTotalDiscount() > 0 && (
                    <div className="flex justify-between">
                      <p className="text-sm text-accent-700">Total Discount</p>
                      <p className="text-sm font-medium text-accent-700 tabular-nums">−₹{getTotalDiscount().toFixed(2)}</p>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3.5">
                    <div className="flex justify-between items-baseline">
                      <p className="text-base font-semibold text-gray-900">Total</p>
                      <p className="text-xl font-semibold text-gray-900 tabular-nums">₹{calculateTotal().toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProceedToCheckout}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
                  >
                    Proceed to Checkout
                  </motion.button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Secure checkout
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
