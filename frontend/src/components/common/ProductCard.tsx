'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product, Category } from '@/types';
import { productBadgeStyles, productBadgeLabels } from '@/lib/productBadge';

interface ProductCardProps {
  product: Product;
  onAddToWishlist?: (productId: string) => void;
  isAddingToWishlist?: boolean;
}

function PlaceholderIcon({ className }: { className: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-300">
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

/**
 * Shared product tile used by the shop grid, related products, and search fallback
 * suggestions. Uses object-contain on a neutral background so the full product is
 * always visible instead of being cropped, and falls back to a placeholder icon if
 * the image URL is missing or fails to load.
 */
export default function ProductCard({
  product,
  onAddToWishlist,
  isAddingToWishlist = false,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = product.images && product.images.length > 0 && !imageFailed;
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const categoryName =
    product.categoryId && typeof product.categoryId !== 'string'
      ? (product.categoryId as Category).name
      : '';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full bg-white rounded-2xl ring-1 ring-gray-100 group-hover:ring-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 p-2.5 sm:p-3 flex flex-col"
    >
      <Link href={`/products/${product._id}`} className="block">
        <div className="relative aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden mb-3">
          {showImage ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <PlaceholderIcon className="w-12 h-12" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors duration-300">
            <span className="px-5 py-2 bg-white text-gray-900 text-xs font-semibold rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              View Product
            </span>
          </div>
          {product.badge && (
            <span
              className={`absolute top-2 left-2 text-white text-[10px] px-2 py-1 rounded-full font-semibold tracking-wide shadow-sm ${
                productBadgeStyles[product.badge] || 'bg-gray-900'
              }`}
            >
              {productBadgeLabels[product.badge] || product.badge}
            </span>
          )}
          {product.discountPrice && (
            <span className="absolute top-2 right-2 bg-accent-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {onAddToWishlist && (
            <div className="absolute bottom-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.preventDefault();
                  onAddToWishlist(product._id);
                }}
                disabled={isAddingToWishlist}
                className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                title="Add to Wishlist"
              >
                {isAddingToWishlist ? (
                  <svg className="animate-spin h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-grow px-0.5 pb-0.5">
        {categoryName && (
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {categoryName}
          </span>
        )}
        <Link href={`/products/${product._id}`} className="flex-grow">
          <h3 className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2 group-hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-auto">
          {product.discountPrice ? (
            <>
              <span className="text-sm font-bold text-gray-900">₹{product.discountPrice.toFixed(2)}</span>
              <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
