'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { productApi } from '@/lib/api';
import { Product, Gender, Category } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';
import { useToastStore } from '@/store/toastStore';
import ProductCard from '@/components/common/ProductCard';
import Reveal from '@/components/common/Reveal';
import { productBadgeStyles, productBadgeLabels } from '@/lib/productBadge';

function ChevronSeparator() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { userType, user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const { guestId, initGuestSession } = useGuestStore();
  const showToast = useToastStore((s) => s.show);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [galleryImageFailed, setGalleryImageFailed] = useState(false);

  // Size and quantity selection
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Action loading states
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const response = await productApi.getById(productId);
        const productData: Product = response.data;
        setProduct(productData);
        // No size is pre-selected — the shopper must explicitly pick one before
        // Add to Cart is enabled (see sizeMissing below).
        setSelectedSize('');

        // Related products: one call to the dedicated endpoint, which already handles
        // curated relatedProductIds + a same-category fallback server-side.
        productApi
          .getRelated(productId, 6)
          .then((res) => setRelatedProducts(res.data || []))
          .catch((err) => console.error('Failed to fetch related products:', err));
      } catch (err) {
        console.error('Failed to fetch product:', err);
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Failed to load product. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Different sizes can have different stock, so re-clamp quantity whenever the
  // selected size changes instead of leaving a stale value that overshoots the new max.
  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, Math.max(availableStock, 1))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize]);

  // Resolves how much stock is actually available: the selected size's stock when the
  // product tracks per-size stock, otherwise the aggregate stock.
  const getStockForSize = (size?: string): number => {
    if (!product) return 0;
    if (!product.sizeStock || product.sizeStock.length === 0) return product.stock;
    const entry = product.sizeStock.find((s) => s.size === size);
    return entry ? entry.stock : 0;
  };

  const availableStock = getStockForSize(selectedSize);
  // Before a size is picked there's no single size to report stock for, so the top
  // badge shows total stock across all sizes instead of resolving to 0 via selectedSize.
  const totalStock =
    product?.sizeStock && product.sizeStock.length > 0
      ? product.sizeStock.reduce((sum, s) => sum + s.stock, 0)
      : product?.stock ?? 0;
  const displayStock = selectedSize ? availableStock : totalStock;
  const hasSizes = !!product?.sizes && product.sizes.length > 0;
  // A product with no sizes configured at all has nothing to select, so it can never
  // be added to cart until an admin adds sizes/stock for it.
  const isUnavailable = !!product && !hasSizes;
  const sizeMissing = hasSizes && !selectedSize;

  const handleAddToCart = async () => {
    if (isUnavailable) {
      showToast('This product is currently unavailable', 'error');
      return;
    }

    if (sizeMissing) {
      showToast('Please select a size', 'error');
      return;
    }

    if (availableStock === 0) {
      showToast('This size is out of stock', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      // Check if user is logged in
      if (userType === 'user' && user) {
        // Logged-in user - add to database cart
        await addToCart(productId, quantity, undefined, selectedSize || undefined);
      } else {
        // Guest user - add to Redis cart
        let currentGuestId = guestId;
        if (!currentGuestId) {
          currentGuestId = await initGuestSession();
        }
        await addToCart(productId, quantity, currentGuestId, selectedSize || undefined);
      }
      showToast('Added to cart successfully!', 'success');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      showToast('Failed to add to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    setAddingToWishlist(true);
    try {
      // Check if user is logged in
      if (userType === 'user' && user) {
        // Logged-in user - add to database wishlist
        await addToWishlist(productId);
      } else {
        // Guest user - add to Redis wishlist
        let currentGuestId = guestId;
        if (!currentGuestId) {
          currentGuestId = await initGuestSession();
        }
        await addToWishlist(productId, currentGuestId);
      }
      showToast('Added to wishlist successfully!', 'success');
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      showToast('Failed to add to wishlist. Please try again.', 'error');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const getGenderName = (genderId: Gender | string | null): string => {
    if (!genderId || typeof genderId === 'string') return '';
    return genderId.name;
  };

  const getCategoryName = (categoryId: Category | string | null): string => {
    if (!categoryId || typeof categoryId === 'string') return '';
    return categoryId.name;
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-100 rounded-full w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              <div className="aspect-square bg-gray-100 rounded-2xl"></div>
              <div>
                <div className="h-3 bg-gray-100 rounded-full w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-100 rounded-full w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-100 rounded-full w-1/3 mb-6"></div>
                <div className="h-4 bg-gray-100 rounded-full w-full mb-2"></div>
                <div className="h-4 bg-gray-100 rounded-full w-5/6 mb-6"></div>
                <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-white min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-gray-900 mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The product you are looking for does not exist or has been removed.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="text-center py-12">
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 sm:mb-10 overflow-x-auto">
          <ol className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
            <li>
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Home
              </Link>
            </li>
            <ChevronSeparator />
            <li>
              <Link href="/products" className="hover:text-gray-900 transition-colors">
                Products
              </Link>
            </li>
            {getGenderName(product.genderId) && (
              <>
                <ChevronSeparator />
                <li className="text-gray-700">{getGenderName(product.genderId)}</li>
              </>
            )}
            {getCategoryName(product.categoryId) && (
              <>
                <ChevronSeparator />
                <li className="text-gray-700">{getCategoryName(product.categoryId)}</li>
              </>
            )}
            <ChevronSeparator />
            <li className="text-gray-900 font-medium truncate max-w-[10rem] sm:max-w-xs">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 sm:mb-24">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 ring-1 ring-gray-900/5 group">
              {product.images && product.images.length > 0 && !galleryImageFailed ? (
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-contain p-6 sm:p-10 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  onError={() => setGalleryImageFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {product.badge && (
                <span
                  className={`absolute top-4 left-4 text-white text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide shadow-sm ${
                    productBadgeStyles[product.badge] || 'bg-gray-900'
                  }`}
                >
                  {productBadgeLabels[product.badge] || product.badge}
                </span>
              )}

              {product.discountPrice && (
                <span className="absolute top-4 right-4 bg-accent-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setGalleryImageFailed(false);
                    }}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 transition-all ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-gray-900 ring-offset-2'
                        : 'ring-1 ring-gray-200 hover:ring-gray-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-contain p-1.5"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {(getGenderName(product.genderId) || getCategoryName(product.categoryId)) && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                {[getGenderName(product.genderId), getCategoryName(product.categoryId)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-gray-900 mb-1 leading-tight">
              {product.name}
            </h1>
            {product.sku && <p className="text-xs text-gray-400 mb-6">SKU: {product.sku}</p>}

            {/* Price */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-5">
              {product.discountPrice ? (
                <>
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ₹{product.discountPrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{product.price.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-accent-700 bg-accent-50 px-2 py-1 rounded-full">
                    Save ₹{(product.price - product.discountPrice).toFixed(0)} ({discountPercent}%)
                  </span>
                </>
              ) : (
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Availability */}
            <div className="mb-6">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  displayStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {displayStock > 0 ? `In Stock — ${displayStock} available` : 'Out of Stock'}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-2">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Size Selector */}
            {hasSizes && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                    Size
                  </h3>
                  {selectedSize && (
                    <span className="text-xs text-gray-400">Selected: {selectedSize}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes!.map((size) => {
                    const sizeStock = getStockForSize(size);
                    const isOutOfStock = sizeStock === 0;
                    // Only show a per-size stock count when the product actually tracks
                    // it — for legacy products without sizeStock, getStockForSize falls
                    // back to the same aggregate number for every size, which would be
                    // misleading to display as if it were size-specific.
                    const hasPerSizeStock = !!product.sizeStock && product.sizeStock.length > 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !isOutOfStock && setSelectedSize(size)}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? `${size} is out of stock` : `${sizeStock} available`}
                        className={`flex flex-col items-center min-w-[3.75rem] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          isOutOfStock
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            : selectedSize === size
                            ? 'bg-gray-900 text-white shadow-sm scale-[1.03]'
                            : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:ring-gray-400'
                        }`}
                      >
                        <span className={isOutOfStock ? 'line-through' : ''}>{size}</span>
                        {hasPerSizeStock && (
                          <span
                            className={`text-[10px] mt-0.5 font-normal ${
                              isOutOfStock
                                ? 'text-gray-300'
                                : selectedSize === size
                                ? 'text-gray-300'
                                : 'text-gray-400'
                            }`}
                          >
                            {isOutOfStock ? 'Out of stock' : `${sizeStock} left`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isUnavailable && (
              <div className="mb-6 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-500">
                This product is currently unavailable.
              </div>
            )}

            {/* Quantity Selector */}
            {!isUnavailable && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-3">
                  Quantity
                </h3>
                <div className="inline-flex items-center rounded-full ring-1 ring-gray-200 overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="text-gray-600 w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(1, Math.min(availableStock, parseInt(e.target.value) || 1))
                      )
                    }
                    min="1"
                    max={availableStock}
                    className="w-12 h-10 text-center text-gray-900 font-semibold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    className="text-gray-600 w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={quantity >= availableStock}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={addingToCart || isUnavailable || sizeMissing || availableStock === 0}
                title={
                  isUnavailable
                    ? 'This product is currently unavailable'
                    : sizeMissing
                    ? 'Please select a size'
                    : undefined
                }
                className="flex-grow px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding...
                  </span>
                ) : isUnavailable ? (
                  'Currently Unavailable'
                ) : sizeMissing ? (
                  'Select a Size'
                ) : availableStock === 0 ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleAddToWishlist}
                disabled={addingToWishlist}
                className="px-4 py-3.5 rounded-xl ring-1 ring-gray-200 hover:ring-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="Add to Wishlist"
              >
                {addingToWishlist ? (
                  <svg className="animate-spin h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                )}
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100">
              {[
                {
                  label: 'Free Shipping',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.223a1.5 1.5 0 011.396.938l1.5 3.75c.06.152.09.313.09.475v3.712a1.125 1.125 0 01-1.125 1.125H14.25m-11.25 0h11.25"
                    />
                  ),
                },
                {
                  label: '7-Day Returns',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                    />
                  ),
                },
                {
                  label: 'Secure Payment',
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center text-center gap-1.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                  <span className="text-[11px] font-medium text-gray-500 leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <Reveal>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs font-semibold text-accent-600 uppercase tracking-widest mb-1">
                    Recommended
                  </p>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-gray-900">
                    You May Also Like
                  </h2>
                </div>
                {getCategoryName(product.categoryId) && (
                  <Link
                    href={`/products?categoryId=${
                      typeof product.categoryId === 'string'
                        ? product.categoryId
                        : product.categoryId._id
                    }`}
                    className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                )}
              </div>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <Reveal key={relatedProduct._id} delay={Math.min(index, 4) * 0.06}>
                  <ProductCard product={relatedProduct} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
