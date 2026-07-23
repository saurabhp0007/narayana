'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { shopSubcategoryApi } from '@/lib/api';
import { ShopSubcategory, ShopCategory } from '@/types';

export default function ShopByCategorySection() {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [subcategoriesByCategoryId, setSubcategoriesByCategoryId] = useState<Record<string, ShopSubcategory[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  useEffect(() => {
    shopSubcategoryApi
      .getActive()
      .then((res) => {
        const subcategories: ShopSubcategory[] = res.data || [];
        const categoryById = new Map<string, ShopCategory>();
        const grouped: Record<string, ShopSubcategory[]> = {};

        for (const subcategory of subcategories) {
          const category = subcategory.shopCategoryId;
          if (!category || typeof category === 'string') continue; // not populated — skip, nothing to group by

          if (!categoryById.has(category._id)) categoryById.set(category._id, category);
          (grouped[category._id] ||= []).push(subcategory);
        }

        setCategories(Array.from(categoryById.values()).sort((a, b) => a.displayOrder - b.displayOrder));
        setSubcategoriesByCategoryId(grouped);
      })
      .catch((err) => console.error('Failed to load shop subcategories:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && categories.length === 0) return null;

  const currentCategoryId = categories.some((c) => c._id === activeCategoryId) ? activeCategoryId : categories[0]?._id;
  const currentSubcategories = currentCategoryId ? subcategoriesByCategoryId[currentCategoryId] || [] : [];

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
              key={category._id}
              onClick={() => setActiveCategoryId(category._id)}
              className={`pb-3 text-xs md:text-sm font-semibold uppercase tracking-wide border-b-2 whitespace-nowrap transition-colors ${
                currentCategoryId === category._id
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
          <div key={currentCategoryId} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
            {currentSubcategories.map((subcategory) => (
              <Link
                key={subcategory._id}
                href={`/products?shopSubcategorySlug=${subcategory.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {subcategory.image ? (
                    <Image
                      src={subcategory.image}
                      alt={subcategory.name}
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
                  {subcategory.offerText && (
                    <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded font-medium">
                      {subcategory.offerText}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{subcategory.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
