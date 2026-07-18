'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { categoryApi, productApi } from '@/lib/api';
import { Category, Product } from '@/types';
import { productBadgeStyles, productBadgeLabels } from '@/lib/productBadge';

export default function ShopByCategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryName, setActiveCategoryName] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getAll({ isActive: true, limit: 100 })
      .then((res) => {
        const data: Category[] = res.data.data || res.data || [];

        // Categories exist per-gender, so dedupe by name to keep tabs gender-neutral.
        const seen = new Set<string>();
        const deduped = data
          .filter((cat) => {
            const key = cat.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        setCategories(deduped);
        if (deduped.length > 0) setActiveCategoryName(deduped[0].name);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const fetchProducts = useCallback(async (categoryName: string) => {
    if (!categoryName) return;
    setIsLoading(true);
    try {
      const res = await productApi.getAll({ categoryName, isActive: true, limit: 8 });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeCategoryName) fetchProducts(activeCategoryName);
  }, [activeCategoryName, fetchProducts]);

  if (categories.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs tracking-widest text-gray-400 uppercase mb-2">Narayan Enterprises</p>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          Shop by Category
        </h2>

        <div className="flex items-center justify-center gap-6 md:gap-10 border-b border-gray-200 mb-10 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategoryName(category.name)}
              className={`pb-3 text-xs md:text-sm font-semibold uppercase tracking-wide border-b-2 whitespace-nowrap transition-colors ${
                activeCategoryName === category.name
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <Link key={product._id} href={`/products/${product._id}`} className="group block">
                <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {product.badge && (
                    <span
                      className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded font-medium ${
                        productBadgeStyles[product.badge] || 'bg-gray-900'
                      }`}
                    >
                      {productBadgeLabels[product.badge] || product.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                {product.discountPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-600">₹{product.discountPrice.toFixed(0)}</span>
                    <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(0)}</span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-gray-900">₹{product.price.toFixed(0)}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
