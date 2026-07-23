'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { footwearSubcategoryApi } from '@/lib/api';
import { FootwearSubcategory, FootwearTabItem } from '@/types';

export default function FootwearSection() {
  const [tabs, setTabs] = useState<FootwearTabItem[]>([]);
  const [subcategoriesByTabId, setSubcategoriesByTabId] = useState<Record<string, FootwearSubcategory[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string>('');

  useEffect(() => {
    footwearSubcategoryApi
      .getActive()
      .then((res) => {
        const subcategories: FootwearSubcategory[] = res.data || [];
        const tabById = new Map<string, FootwearTabItem>();
        const grouped: Record<string, FootwearSubcategory[]> = {};

        for (const subcategory of subcategories) {
          const tab = subcategory.footwearTabId;
          if (!tab || typeof tab === 'string') continue; // not populated — skip, nothing to group by

          if (!tabById.has(tab._id)) tabById.set(tab._id, tab);
          (grouped[tab._id] ||= []).push(subcategory);
        }

        setTabs(Array.from(tabById.values()).sort((a, b) => a.displayOrder - b.displayOrder));
        setSubcategoriesByTabId(grouped);
      })
      .catch((err) => console.error('Failed to load footwear subcategories:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && tabs.length === 0) return null;

  const currentTabId = tabs.some((t) => t._id === activeTabId) ? activeTabId : tabs[0]?._id;
  const currentSubcategories = currentTabId ? subcategoriesByTabId[currentTabId] || [] : [];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ fontFamily: 'Georgia, serif' }}>
          Footwear
        </h2>

        <div className="flex items-center justify-center gap-6 md:gap-10 border-b border-gray-200 mb-10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab._id}
              onClick={() => setActiveTabId(tab._id)}
              className={`pb-3 text-xs md:text-sm font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                currentTabId === tab._id
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
          </div>
        ) : (
          <div key={currentTabId} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
            {currentSubcategories.map((subcategory) => (
              <Link
                key={subcategory._id}
                href={`/products?subcategorySlug=${subcategory.slug}`}
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
