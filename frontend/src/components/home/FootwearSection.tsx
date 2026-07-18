'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { offerApi } from '@/lib/api';
import { Offer, Product, FootwearTabItem } from '@/types';
import { productBadgeStyles, productBadgeLabels } from '@/lib/productBadge';

type PriceDisplay =
  | { kind: 'discount'; salePrice: number; originalPrice: number; savings: number }
  | { kind: 'bundle'; unitPrice: number; minQuantity: number; bundlePrice: number; savings: number }
  | { kind: 'buyXGetY'; buyQuantity: number; getQuantity: number }
  | null;

function getPriceDisplay(offer: Offer, product: Product): PriceDisplay {
  const basePrice = product.discountPrice || product.price;
  const rules = offer.rules || {};
  const { offerType } = offer;

  if (offerType === 'percentageOff' && rules.discountPercentage) {
    const savings = Math.round((basePrice * rules.discountPercentage) / 100);
    return { kind: 'discount', salePrice: basePrice - savings, originalPrice: basePrice, savings };
  }

  if (offerType === 'fixedAmountOff' && rules.discountAmount) {
    const savings = Math.min(rules.discountAmount, basePrice);
    return { kind: 'discount', salePrice: basePrice - savings, originalPrice: basePrice, savings };
  }

  if (offerType === 'bundleDiscount' && rules.bundlePrice && rules.minQuantity) {
    const savings = basePrice * rules.minQuantity - rules.bundlePrice;
    if (savings <= 0) return null;
    return { kind: 'bundle', unitPrice: basePrice, minQuantity: rules.minQuantity, bundlePrice: rules.bundlePrice, savings };
  }

  if (offerType === 'buyXgetY' && rules.buyQuantity && rules.getQuantity) {
    return { kind: 'buyXGetY', buyQuantity: rules.buyQuantity, getQuantity: rules.getQuantity };
  }

  return null;
}

function PriceBlock({ price }: { price: PriceDisplay }) {
  if (!price) return null;

  if (price.kind === 'discount') {
    return (
      <div className="mt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-red-600">Sale Price ₹{price.salePrice.toFixed(0)}</span>
          <span className="text-xs text-gray-400 line-through">₹{price.originalPrice.toFixed(0)}</span>
        </div>
        <p className="text-xs text-green-700">Save ₹{price.savings.toFixed(0)}</p>
      </div>
    );
  }

  if (price.kind === 'bundle') {
    return (
      <div className="mt-1 text-xs text-gray-700 space-y-0.5">
        <p>1 pair @ ₹{price.unitPrice.toFixed(0)}</p>
        <p className="font-semibold text-gray-900">
          {price.minQuantity} pairs @ ₹{price.bundlePrice.toFixed(0)}{' '}
          <span className="font-normal text-green-700">— save ₹{price.savings.toFixed(0)}</span>
        </p>
      </div>
    );
  }

  return (
    <p className="mt-1 text-sm font-semibold text-gray-900">
      Buy {price.buyQuantity} Get {price.getQuantity} Free
    </p>
  );
}

export default function FootwearSection() {
  const [tabs, setTabs] = useState<FootwearTabItem[]>([]);
  const [offersByTabId, setOffersByTabId] = useState<Record<string, Offer[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string>('');

  useEffect(() => {
    offerApi
      .getFootwear()
      .then((res) => {
        const offers: Offer[] = res.data || [];
        const tabById = new Map<string, FootwearTabItem>();
        const grouped: Record<string, Offer[]> = {};

        for (const offer of offers) {
          const tab = offer.footwearTabId;
          if (!tab || typeof tab === 'string') continue; // not populated — skip, nothing to group by

          if (!tabById.has(tab._id)) tabById.set(tab._id, tab);
          (grouped[tab._id] ||= []).push(offer);
        }

        setTabs(Array.from(tabById.values()).sort((a, b) => a.displayOrder - b.displayOrder));
        setOffersByTabId(grouped);
      })
      .catch((err) => console.error('Failed to load footwear offers:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && tabs.length === 0) return null;

  const currentTabId = tabs.some((t) => t._id === activeTabId) ? activeTabId : tabs[0]?._id;
  const currentOffers = currentTabId ? offersByTabId[currentTabId] || [] : [];

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
            {currentOffers.map((offer) => {
              const product = (offer.productIds as Product[])?.[0];
              if (!product) return null;

              const price = getPriceDisplay(offer, product);

              return (
                <Link key={offer._id} href={`/products/${product._id}`} className="group block">
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
                  {price ? (
                    <PriceBlock price={price} />
                  ) : product.discountPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-600">₹{product.discountPrice.toFixed(0)}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(0)}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">₹{product.price.toFixed(0)}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
