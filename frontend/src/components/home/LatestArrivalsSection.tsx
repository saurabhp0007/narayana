'use client';

import { useEffect, useState } from 'react';
import { productApi } from '@/lib/api';
import { LatestArrivalsSection as SectionCardData } from '@/types';
import SlideCard from '@/components/common/SlideCard';
import { ProductGridSkeleton } from '@/components/common/Skeleton';

type TabKey = 'latest' | 'bestSellers';

const TAB_CONFIG: Record<TabKey, { label: string; badgeLabel: string; fetch: () => Promise<{ data: SectionCardData[] }> }> = {
  latest: { label: 'Latest Arrivals', badgeLabel: 'New', fetch: productApi.getLatestArrivals },
  bestSellers: { label: 'Best Sellers', badgeLabel: 'Best Seller', fetch: productApi.getBestSellersSections },
};

export default function LatestArrivalsSection() {
  const [activeTab, setActiveTab] = useState<TabKey>('latest');
  const [sectionsByTab, setSectionsByTab] = useState<Record<TabKey, SectionCardData[]>>({
    latest: [],
    bestSellers: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([TAB_CONFIG.latest.fetch(), TAB_CONFIG.bestSellers.fetch()])
      .then(([latestResult, bestSellersResult]) => {
        setSectionsByTab({
          latest: latestResult.status === 'fulfilled' ? latestResult.value.data || [] : [],
          bestSellers: bestSellersResult.status === 'fulfilled' ? bestSellersResult.value.data || [] : [],
        });
        if (latestResult.status === 'rejected') console.error('Failed to load latest arrivals:', latestResult.reason);
        if (bestSellersResult.status === 'rejected') console.error('Failed to load best sellers:', bestSellersResult.reason);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const tabs = (Object.keys(TAB_CONFIG) as TabKey[]).filter(
    (key) => isLoading || sectionsByTab[key].length > 0,
  );

  if (!isLoading && tabs.length === 0) return null;

  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0];
  const currentSections = currentTab ? sectionsByTab[currentTab] : [];

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          {tabs.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`text-lg md:text-xl font-bold uppercase tracking-wide transition-colors ${
                currentTab === key ? 'text-gray-900' : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              {TAB_CONFIG[key].label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={8} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" />
        ) : (
          <div key={currentTab} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
            {currentSections.map((section) => (
              <SlideCard
                key={section.categoryId}
                href={`/products?categoryId=${section.categoryId}`}
                images={section.images}
                title={section.categoryName}
                badge={{ label: TAB_CONFIG[currentTab].badgeLabel }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
