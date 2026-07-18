'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const SLIDE_INTERVAL_MS = 4500;
const FADE_DURATION_MS = 1200;

export interface SlideCardBadge {
  label: string;
  className?: string; // background + text color classes, e.g. "bg-gray-900 text-white"
}

interface SlideCardProps {
  href: string;
  images: string[];
  title: string;
  alt?: string;
  badge?: SlideCardBadge;
  subtitle?: React.ReactNode;
  slideIntervalMs?: number;
}

const DEFAULT_BADGE_CLASSNAME = 'bg-white/90 text-gray-900';

/**
 * Shared product/category tile: single image or auto-crossfading slideshow,
 * a bottom-left badge on the image, a title, and slide dots below the title.
 * Used by the homepage Latest Arrivals / Best Sellers tabs, and reusable elsewhere.
 */
export default function SlideCard({
  href,
  images,
  title,
  alt,
  badge,
  subtitle,
  slideIntervalMs = SLIDE_INTERVAL_MS,
}: SlideCardProps) {
  // Random starting slide so every card doesn't open on image 1 simultaneously
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(Math.random() * images.length));
  const [isZooming, setIsZooming] = useState(false);
  const isSlideshow = images.length > 1;

  useEffect(() => {
    if (!isSlideshow) return;

    // Stagger each card's first tick to a random point in the cycle so cards
    // drift out of sync instead of all flipping to the next image at once.
    const initialDelay = Math.random() * slideIntervalMs;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeoutId = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
      intervalId = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % images.length);
      }, slideIntervalMs);
    }, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSlideshow, images.length, slideIntervalMs]);

  // Slow continuous "Ken Burns" zoom on the active slide — reset instantly on
  // slide change, then kick off the zoom-in on the next frame so the browser
  // actually animates the transition instead of snapping straight to the end state.
  useEffect(() => {
    if (!isSlideshow) return;
    setIsZooming(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsZooming(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, isSlideshow]);

  if (images.length === 0) return null;

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden mb-3">
        {images.map((image, index) => {
          const isActive = !isSlideshow || index === activeIndex;
          return (
            <Image
              key={image}
              src={image}
              alt={alt || title}
              fill
              className={`object-cover ${!isSlideshow ? 'transition-transform duration-500 ease-out group-hover:scale-105' : ''}`}
              style={
                isSlideshow
                  ? {
                      opacity: isActive ? 1 : 0,
                      transform: isActive && isZooming ? 'scale(1.08)' : 'scale(1)',
                      transition: `opacity ${FADE_DURATION_MS}ms ease-in-out, transform ${slideIntervalMs}ms ease-out`,
                    }
                  : undefined
              }
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          );
        })}

        {badge && (
          <span
            className={`absolute bottom-3 left-3 rounded-sm text-xs px-3 py-1.5 font-medium tracking-[0.15em] uppercase ${
              badge.className || DEFAULT_BADGE_CLASSNAME
            }`}
          >
            {badge.label}
          </span>
        )}
      </div>
      <h3 className="text-sm md:text-base font-medium text-gray-900 group-hover:underline transition-colors">
        {title}
      </h3>

      {isSlideshow && (
        <div className="flex items-center gap-1.5 mt-2">
          {images.map((image, index) => (
            <span
              key={image}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-4 bg-gray-900' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {subtitle}
    </Link>
  );
}
