'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { footwearSubcategoryApi } from '@/lib/api';
import { FootwearSubcategory } from '@/types';

export default function FootwearSection() {
  const [tabNames, setTabNames] = useState<string[]>([]);
  const [subcategoriesByTab, setSubcategoriesByTab] = useState<Record<string, FootwearSubcategory[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    footwearSubcategoryApi
      .getActive()
      .then((res) => {
        const subcategories: FootwearSubcategory[] = res.data || [];
        const seenTabs: string[] = [];
        const grouped: Record<string, FootwearSubcategory[]> = {};

        for (const subcategory of subcategories) {
          if (!subcategory.tabName) continue;
          if (!grouped[subcategory.tabName]) seenTabs.push(subcategory.tabName);
          (grouped[subcategory.tabName] ||= []).push(subcategory);
        }

        setTabNames(seenTabs);
        setSubcategoriesByTab(grouped);
      })
      .catch((err) => console.error('Failed to load footwear subcategories:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && tabNames.length === 0) return null;

  const currentTab = tabNames.includes(activeTab) ? activeTab : tabNames[0];
  const currentSubcategories = currentTab ? subcategoriesByTab[currentTab] || [] : [];

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          Footwear
        </h2>

        <div className="flex items-center justify-center gap-6 md:gap-10 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabNames.map((tabName) => (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`pb-3 text-xs md:text-sm font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                currentTab === tabName
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tabName}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
          </div>
        ) : (
          <div key={currentTab} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
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
