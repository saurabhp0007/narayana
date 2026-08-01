'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeroBanner } from '@/types';
import HeroBannerCarousel, { HeroBannerSkeleton } from '@/components/home/HeroBannerCarousel';
import CountdownTimer from '@/components/home/CountdownTimer';
import TrustBadges from '@/components/home/TrustBadges';
import ReviewsSection from '@/components/home/ReviewsSection';
import ShopByCategorySection from '@/components/home/ShopByCategorySection';
import LatestArrivalsSection from '@/components/home/LatestArrivalsSection';
import FootwearSection from '@/components/home/FootwearSection';
import CollectionsSection from '@/components/home/CollectionsSection';
import { useDataStore } from '@/store/dataStore';
import { settingsApi, heroBannerApi } from '@/lib/api';

export default function HomePage() {
  const { allCategories, fetchGenders, fetchAllCategories } = useDataStore();

  // Distinct, real category names (categories exist per-gender, so dedupe by name)
  const topNavCategories = Array.from(new Set(allCategories.map((c) => c.name))).slice(0, 8);

  const [isLoading, setIsLoading] = useState(true);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [countdown, setCountdown] = useState<{ enabled: boolean; endDate?: string; label?: string }>({
    enabled: false,
  });
  const [announcementText, setAnnouncementText] = useState<string | undefined>();

  useEffect(() => {
    // Each section's data is independent — one failing fetch shouldn't blank out the rest of the page.
    const fetchData = async () => {
      const results = await Promise.allSettled([
        fetchGenders(),
        fetchAllCategories(),
        heroBannerApi.getActive(),
        settingsApi.getHomepage(),
      ]);

      const [, , heroBannersResult, settingsResult] = results;

      if (heroBannersResult.status === 'fulfilled') setHeroBanners(heroBannersResult.value.data || []);

      if (settingsResult.status === 'fulfilled') {
        const settings = settingsResult.value.data;
        setCountdown({
          enabled: settings?.countdownEnabled || false,
          endDate: settings?.countdownEndDate,
          label: settings?.countdownLabel,
        });
        setAnnouncementText(settings?.announcementBarEnabled ? settings?.announcementBarText : undefined);
      }

      results.forEach((r) => {
        if (r.status === 'rejected') console.error('Homepage data fetch failed:', r.reason);
      });

      setIsLoading(false);
    };

    fetchData();
  }, [fetchGenders, fetchAllCategories]);

  const showCountdown =
    countdown.enabled && countdown.endDate && new Date(countdown.endDate).getTime() > Date.now();

  return (
    <div className="bg-white">
      {/* Hero Banner Carousel */}
      {isLoading ? (
        <HeroBannerSkeleton />
      ) : (
        <HeroBannerCarousel banners={heroBanners} announcementText={announcementText} />
      )}

      {/* Mega Sale Countdown */}
      {showCountdown && countdown.endDate && (
        <CountdownTimer endDate={countdown.endDate} label={countdown.label} />
      )}

      {/* Latest Arrivals */}
      <LatestArrivalsSection />

      {/* Footwear */}
      <FootwearSection />

      {/* Shop by Category */}
      <ShopByCategorySection />

      {/* Curated Collections */}
      <CollectionsSection />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Customer Reviews */}
      <ReviewsSection />
    </div>
  );
}
