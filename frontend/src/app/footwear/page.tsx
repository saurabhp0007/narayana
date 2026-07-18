'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { categoryApi, productApi } from '@/lib/api';
import { Category, Gender } from '@/types';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

type TabKey = 'deals' | 'mens' | 'womens';

function getGenderName(genderId: Gender | string): string {
  return typeof genderId === 'string' ? '' : genderId.name;
}

function CategoryTile({ category, image }: { category: Category; image?: string }) {
  return (
    <Link href={`/products?categoryId=${category._id}`} className="group block">
      <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-3">
        {image ? (
          <Image
            src={image}
            alt={category.name}
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
        {category.tileLabel && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold uppercase px-2 py-1 rounded">
            {category.tileLabel}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
    </Link>
  );
}

export default function FootwearPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('deals');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageByCategory, setImageByCategory] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catsRes = await categoryApi.getByTabGroup('footwear');
        const cats: Category[] = catsRes.data || [];
        setCategories(cats);

        const imageEntries = await Promise.all(
          cats.map(async (cat) => {
            const res = await productApi.getByCategory(cat._id);
            const products = res.data || [];
            const image = products.find((p: { images?: string[] }) => p.images?.length)?.images?.[0];
            return [cat._id, image] as const;
          }),
        );
        setImageByCategory(
          Object.fromEntries(imageEntries.filter(([, image]) => Boolean(image))) as Record<string, string>
        );
      } catch (err) {
        console.error('Failed to load footwear data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const dealsCategories = categories.filter((c) => c.tileLabel);
  const mensCategories = categories.filter((c) => getGenderName(c.genderId) === 'Men');
  const othersCategories = categories.filter((c) => getGenderName(c.genderId) !== 'Men');

  const tabs: { key: TabKey; label: string; items: Category[] }[] = [
    { key: 'deals', label: 'Deals & Combos', items: dealsCategories },
    { key: 'mens', label: "Men's Shoes", items: mensCategories },
    { key: 'womens', label: 'Women & More', items: othersCategories },
  ];

  const activeItems = tabs.find((t) => t.key === activeTab)?.items || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            Footwear
          </h1>

          <div className="flex items-center justify-center gap-6 md:gap-10 border-b border-gray-200 mb-10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-xs md:text-sm font-semibold uppercase tracking-wide border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
            </div>
          ) : activeItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {activeItems.map((category) => (
                <CategoryTile key={category._id} category={category} image={imageByCategory[category._id]} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">No items in this section yet.</div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
