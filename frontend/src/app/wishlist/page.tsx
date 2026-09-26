'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function WishlistPage() {
  const { items, isLoading, error, fetchWishlist, removeFromWishlist, clearError } = useWishlistStore();
  const { addToCart, isLoading: isCartLoading } = useCartStore();
  const { userType, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
    fetchWishlist();
  }, [loadFromStorage, fetchWishlist]);

  const handleMoveToCart = async (itemId: string, productId: string) => {
    try {
      await addToCart(productId);
      await removeFromWishlist(itemId);
    } catch {
      // Error handled by store
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      await removeFromWishlist(itemId);
    } catch {
      // Error handled by store
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your wishlist</h2>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

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
            <p className="mt-4 text-gray-600">Loading wishlist...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
            <p className="mt-2 text-sm text-gray-500">Save items you love to your wishlist.</p>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item._id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="relative h-64">
                  {item.productId.images && item.productId.images[0] ? (
                    <Image
                      src={item.productId.images[0]}
                      alt={item.productId.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{item.productId.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">SKU: {item.productId.sku}</p>
                  <div className="mt-2">
                    {item.productId.discountPrice ? (
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{item.productId.discountPrice.toFixed(2)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ₹{item.productId.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        ₹{item.productId.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleMoveToCart(item._id, item.productId._id)}
                      disabled={isLoading || isCartLoading || item.productId.stock === 0}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {item.productId.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item._id)}
                      disabled={isLoading}
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
