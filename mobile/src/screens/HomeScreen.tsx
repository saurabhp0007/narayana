import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../lib/theme';
import { AppHeader } from '../components/common/AppHeader';
import { HeroBannerCarousel, HeroBannerSkeleton } from '../components/home/HeroBannerCarousel';
import { CountdownTimer } from '../components/home/CountdownTimer';
import { LatestArrivalsSection } from '../components/home/LatestArrivalsSection';
import { FootwearSection } from '../components/home/FootwearSection';
import { ShopByCategorySection } from '../components/home/ShopByCategorySection';
import { CollectionsSection } from '../components/home/CollectionsSection';
import { TrustBadges } from '../components/home/TrustBadges';
import { ReviewsSection } from '../components/home/ReviewsSection';
import { heroBannerApi, settingsApi } from '../lib/api';
import { HeroBanner, HomepageSettings } from '../types';

export const HomeScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [countdown, setCountdown] = useState<{ enabled: boolean; endDate?: string; label?: string }>({
    enabled: false,
  });
  const [announcementText, setAnnouncementText] = useState<string | undefined>();

  useEffect(() => {
    // Each section fetches its own data independently — one failing request
    // here shouldn't blank out the rest of the page.
    const fetchData = async () => {
      const results = await Promise.allSettled([heroBannerApi.getActive(), settingsApi.getHomepage()]);
      const [heroBannersResult, settingsResult] = results;

      if (heroBannersResult.status === 'fulfilled') {
        setHeroBanners(heroBannersResult.value.data.data || heroBannersResult.value.data || []);
      }

      if (settingsResult.status === 'fulfilled') {
        const settings: HomepageSettings = settingsResult.value.data.data || settingsResult.value.data || {};
        setCountdown({
          enabled: settings.countdownEnabled || false,
          endDate: settings.countdownEndDate,
          label: settings.countdownLabel,
        });
        setAnnouncementText(settings.announcementBarEnabled ? settings.announcementBarText : undefined);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const showCountdown =
    countdown.enabled && countdown.endDate && new Date(countdown.endDate).getTime() > Date.now();

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <HeroBannerSkeleton />
        ) : (
          <HeroBannerCarousel banners={heroBanners} announcementText={announcementText} />
        )}

        {showCountdown && countdown.endDate ? (
          <CountdownTimer endDate={countdown.endDate} label={countdown.label} />
        ) : null}

        <LatestArrivalsSection />
        <FootwearSection />
        <ShopByCategorySection />
        <CollectionsSection />
        <TrustBadges />
        <ReviewsSection />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
