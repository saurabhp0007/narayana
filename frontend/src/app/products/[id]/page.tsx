'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { productApi } from '@/lib/api';
import { Product, Gender, Category } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';
import ProductCard from '@/components/common/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { userType, user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const { guestId, initGuestSession } = useGuestStore();

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

        // Default to the first in-stock size when per-size stock is tracked, so the
        // page doesn't land on a size that's immediately disabled.
        if (productData.sizes && productData.sizes.length > 0) {
          const inStockSize = productData.sizeStock?.find((s) => s.stock > 0)?.size;
          setSelectedSize(inStockSize || productData.sizes[0]);
        }

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

  const handleAddToCart = async () => {
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }

    if (availableStock === 0) {
      alert('This size is out of stock');
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
      alert('Added to cart successfully!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add to cart. Please try again.');
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
      alert('Added to wishlist successfully!');
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      alert('Failed to add to wishlist. Please try again.');
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
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-4">
              The product you are looking for does not exist or has been removed.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
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
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/products" className="hover:text-blue-600">
                  Products
                </Link>
              </li>
              {getGenderName(product.genderId) && (
                <>
                  <li>/</li>
                  <li>
                    <span className="text-gray-900">{getGenderName(product.genderId)}</span>
                  </li>
                </>
              )}
              {getCategoryName(product.categoryId) && (
                <>
                  <li>/</li>
                  <li>
                    <span className="text-gray-900">{getCategoryName(product.categoryId)}</span>
                  </li>
                </>
              )}
              <li>/</li>
              <li>
                <span className="text-gray-900 font-medium">{product.name}</span>
              </li>
            </ol>
          </nav>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery */}
            <div>
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
                {product.images && product.images.length > 0 && !galleryImageFailed ? (
                  <Image
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    onError={() => setGalleryImageFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {product.discountPrice && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white text-sm px-3 py-1 rounded">
                    {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                    OFF
                  </span>
                )}
              </div>

              {/* Image Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setGalleryImageFailed(false);
                      }}
                      className={`relative w-20 h-20 flex-shrink-0 rounded border-2 bg-gray-50 overflow-hidden ${
                        selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Price */}
              <div className="mb-6">
                {product.discountPrice ? (
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-green-600">
                      ₹{product.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.price.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{product.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock Availability */}
              <div className="mb-6">
                {availableStock > 0 ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">In Stock</span>
                    <span className="text-gray-600 ml-2">({availableStock} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
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
                          className={`flex flex-col items-center min-w-[3.5rem] px-4 py-2 border rounded-md font-medium transition-colors ${
                            isOutOfStock
                              ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                              : selectedSize === size
                              ? 'text-black border-blue-500 bg-blue-50 text-blue-700'
                              : 'text-black border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className={isOutOfStock ? 'line-through' : ''}>{size}</span>
                          {hasPerSizeStock && (
                            <span
                              className={`text-[10px] mt-0.5 font-normal ${
                                isOutOfStock ? 'text-gray-300' : 'text-gray-500'
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

              {/* Quantity Selector */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quantity</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="text-black px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Math.min(availableStock, parseInt(e.target.value) || 1)))
                    }
                    min="1"
                    max={availableStock}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center text-black"
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    className="text-black px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || availableStock === 0}
                  className="flex-grow px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  ) : availableStock === 0 ? (
                    'Out of Stock'
                  ) : (
                    'Add to Cart'
                  )}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  title="Add to Wishlist"
                >
                  {addingToWishlist ? (
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
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
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
                {getCategoryName(product.categoryId) && (
                  <Link
                    href={`/products?categoryId=${typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id}`}
                    className="text-sm font-medium text-gray-900 hover:text-gray-600"
                  >
                    View All &rarr;
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct._id} product={relatedProduct} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
