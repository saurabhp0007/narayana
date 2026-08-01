'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { HeroBanner } from '@/types';

interface HeroBannerCarouselProps {
  banners: HeroBanner[];
  announcementText?: string;
}

const SWIPE_THRESHOLD = 60;

/**
 * Loading placeholder shaped like the real hero: a pulsing image field with
 * subtitle/title/button-shaped bars overlaid in the same position real banner
 * text lands in, so the page doesn't jump when the real content swaps in.
 */
export function HeroBannerSkeleton() {
  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-gray-100 animate-pulse">
      <div className="absolute inset-0 flex flex-col justify-end md:justify-center px-6 md:px-16 pb-16 md:pb-0">
        <div className="max-w-lg space-y-4">
          <div className="h-3 w-28 rounded-full bg-gray-300/70" />
          <div className="space-y-2">
            <div className="h-8 md:h-12 w-64 md:w-96 rounded bg-gray-300/70" />
            <div className="h-8 md:h-12 w-44 md:w-64 rounded bg-gray-300/70" />
          </div>
          <div className="h-10 w-32 rounded bg-gray-300/70" />
        </div>
      </div>
    </div>
  );
}

export default function HeroBannerCarousel({ banners, announcementText }: HeroBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [goToNext, banners.length]);

  const banner = banners[activeIndex];

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (banners.length <= 1) return;
    if (info.offset.x < -SWIPE_THRESHOLD) {
      goToNext();
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  return (
    <section className="relative w-full bg-gray-100">
      {/* Announcement bar — a continuous ticker/marquee (the content is duplicated
          8x and looped by exactly -50% of the strip's width, which lands on an
          identical repeat boundary for a seamless, uninterrupted scroll) rather
          than a static banner with an entrance effect. No icon — the motion of the
          text itself is the whole effect. Falls back to a static centered line
          when the visitor has reduced motion enabled. */}
      {announcementText && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 py-2.5">
          {shouldReduceMotion ? (
            <p className="text-center text-xs md:text-sm font-semibold tracking-wide text-white px-4">
              {announcementText}
            </p>
          ) : (
            <motion.div
              className="flex w-max whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            >
              {[...Array(8)].map((_, i) => (
                <span
                  key={i}
                  className="flex items-center text-xs md:text-sm font-semibold tracking-wide text-white px-6"
                >
                  {announcementText}
                  <span className="ml-6 text-white/50" aria-hidden="true">
                    &bull;
                  </span>
                </span>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {banners.length === 0 ? null : (
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={banner._id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            drag={banners.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <motion.div
              className="absolute inset-0"
              initial={shouldReduceMotion ? undefined : { scale: 1 }}
              animate={shouldReduceMotion ? undefined : { scale: 1.08 }}
              transition={{ duration: 5, ease: 'linear' }}
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                priority={activeIndex === 0}
                className="object-cover pointer-events-none"
                sizes="100vw"
                draggable={false}
              />
            </motion.div>

            {/* Dark gradient for text legibility */}
            {/* Bottom gradient (mobile text sits at the bottom) + left gradient (desktop text sits mid-left) — layered so the text has a dark backdrop regardless of what the photo behind it looks like */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

            {/* Text overlay */}
            <div className="absolute inset-0 flex flex-col justify-end md:justify-center px-6 md:px-16 pb-16 md:pb-0">
              <div className="max-w-lg">
                {banner.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="text-white text-xs md:text-sm font-medium uppercase tracking-widest mb-2"
                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)' }}
                  >
                    {banner.subtitle}
                  </motion.p>
                )}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-white text-2xl sm:text-3xl md:text-5xl font-bold uppercase leading-tight mb-6"
                  style={{ textShadow: '0 4px 24px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.9)' }}
                >
                  {banner.title}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={banner.linkUrl}
                    className="inline-block border border-white bg-black/10 backdrop-blur-sm text-white text-xs md:text-sm font-medium tracking-widest uppercase px-6 py-3 hover:bg-white hover:text-gray-900 transition-colors"
                  >
                    {banner.buttonText || 'Shop Now'}
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

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
