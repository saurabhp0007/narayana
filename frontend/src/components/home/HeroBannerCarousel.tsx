'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroBanner } from '@/types';

interface HeroBannerCarouselProps {
  banners: HeroBanner[];
  announcementText?: string;
}

export default function HeroBannerCarousel({ banners, announcementText }: HeroBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [goToNext, banners.length]);

  const banner = banners[activeIndex];

  return (
    <section className="relative w-full bg-gray-100">
      {/* Announcement bar — independent of hero banners existing */}
      {announcementText && (
        <div className="animate-breathe relative overflow-hidden border-b border-amber-100 px-4 py-2.5 text-center">
          <span className="animate-fade-in-up relative inline-flex items-center gap-2 text-xs md:text-sm font-medium tracking-wide text-amber-900">
            <svg className="h-4 w-4 shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 2l1.8 5.5H17l-4.6 3.4 1.8 5.6L10 13.1l-4.2 3.4 1.8-5.6L3 7.5h5.2z" />
            </svg>
            {announcementText}
          </span>
        </div>
      )}

      {banners.length === 0 ? null : (
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden">
        <Image
          key={banner._id}
          src={banner.image}
          alt={banner.title}
          fill
          priority
          className="object-cover transition-opacity duration-500"
          sizes="100vw"
        />

        {/* Dark gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col justify-end md:justify-center px-6 md:px-16 pb-16 md:pb-0">
          <div className="max-w-lg">
            {banner.subtitle && (
              <p className="text-white/90 text-xs md:text-sm font-medium uppercase tracking-widest mb-2">
                {banner.subtitle}
              </p>
            )}
            <h2
              className="text-white text-2xl sm:text-3xl md:text-5xl font-bold uppercase leading-tight mb-6"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {banner.title}
            </h2>
            <Link
              href={banner.linkUrl}
              className="inline-block border border-white text-white text-xs md:text-sm font-medium tracking-widest uppercase px-6 py-3 hover:bg-white hover:text-gray-900 transition-colors"
            >
              {banner.buttonText || 'Shop Now'}
            </Link>
          </div>
        </div>

        {/* Prev/Next arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              aria-label="Previous banner"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-200 w-8 h-8 flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              aria-label="Next banner"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-200 w-8 h-8 flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      )}
    </section>
  );
}
