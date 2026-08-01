'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useGuestStore } from '@/store/guestStore';
import { guestApi } from '@/lib/api';

interface GuestCheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { items, summary, isLoading, fetchCart, clearCart } = useCartStore();
  const { guestId } = useGuestStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<GuestCheckoutForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    if (guestId) {
      fetchCart(guestId);
    } else {
      // No guest session, redirect to cart
      router.push('/cart');
    }
  }, [guestId, fetchCart, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestId) {
      setError('Guest session not found. Please try again.');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const checkoutData = {
        guestId,
        customerDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        notes: formData.notes,
      };

      const response = await guestApi.checkout(checkoutData);

      // Clear cart after successful order
      await clearCart(guestId);

      alert(`Order placed successfully! Order ID: ${response.data.orderId}\nA confirmation email will be sent to ${formData.email}`);
      router.push('/');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!guestId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Guest Checkout</h1>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {isLoading && items.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-900 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-2 text-sm text-gray-500">Add some products before checkout.</p>
              <div className="mt-6">
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
                >
                  Browse Products
                </Link>
              </div>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="10-digit number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h2>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Special instructions for your order (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full flex justify-center items-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-gray-900 font-medium hover:underline">
                      Login
                    </Link>{' '}
                    to save your order history.
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-5 mt-8 lg:mt-0">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                  {/* Cart Items */}
                  <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                    {items.map((item) => (
                      <div key={item._id} className="flex items-center gap-3">
                        <div className="shrink-0 w-16 h-16 relative">
                          {item?.product?.images && item?.product?.images[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item?.product?.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">₹{item.itemTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
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
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Shipping</p>
                      <p className="text-sm font-medium text-gray-900">Free</p>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <p className="text-base font-semibold text-gray-900">Total</p>
                        <p className="text-base font-semibold text-gray-900">₹{calculateTotal().toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
