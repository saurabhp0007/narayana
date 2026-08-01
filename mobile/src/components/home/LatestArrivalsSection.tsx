import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { productApi } from '../../lib/api';
import { LatestArrivalsCategory } from '../../types';
import { SlideCard } from '../common/SlideCard';
import { ProductGridSkeleton } from '../common/Skeleton';
import { Tabs } from '../common/Tabs';
import { colors, spacing } from '../../lib/theme';

type TabKey = 'latest' | 'bestSellers';

const TAB_CONFIG: Record<TabKey, { label: string; badgeLabel: string; fetch: () => Promise<any> }> = {
  latest: { label: 'Latest Arrivals', badgeLabel: 'New', fetch: productApi.getLatestArrivals },
  bestSellers: { label: 'Best Sellers', badgeLabel: 'Best Seller', fetch: productApi.getBestSellersSections },
};

const { width } = Dimensions.get('window');
const COLUMNS = 2;
const GAP = spacing.md;
const TILE_WIDTH = (width - spacing.md * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

export function LatestArrivalsSection() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>('latest');
  const [sectionsByTab, setSectionsByTab] = useState<Record<TabKey, LatestArrivalsCategory[]>>({
    latest: [],
    bestSellers: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([TAB_CONFIG.latest.fetch(), TAB_CONFIG.bestSellers.fetch()])
      .then(([latestResult, bestSellersResult]) => {
        setSectionsByTab({
          latest: latestResult.status === 'fulfilled' ? latestResult.value.data.data || latestResult.value.data || [] : [],
          bestSellers:
            bestSellersResult.status === 'fulfilled'
              ? bestSellersResult.value.data.data || bestSellersResult.value.data || []
              : [],
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const tabs = (Object.keys(TAB_CONFIG) as TabKey[]).filter((key) => isLoading || sectionsByTab[key].length > 0);

  if (!isLoading && tabs.length === 0) return null;

  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0];
  const currentSections = currentTab ? sectionsByTab[currentTab] : [];

  const goToCategory = (categoryId: string) => {
    navigation.dispatch(CommonActions.navigate({ name: 'Root', params: { screen: 'Products', params: { categoryId } } }));
  };

  return (
    <View style={styles.section}>
      <Tabs
        tabs={tabs.map((key) => ({ id: key, label: TAB_CONFIG[key].label }))}
        activeId={currentTab}
        onChange={(id) => setActiveTab(id as TabKey)}
        variant="weight"
        scrollable={false}
      />

      <View style={styles.gridWrap}>
        {isLoading ? (
          <ProductGridSkeleton count={8} columns={COLUMNS} />
        ) : (
          <View style={styles.grid}>
            {currentSections.map((section) => (
              <SlideCard
                key={section.categoryId}
                images={section.images}
                title={section.categoryName}
                badgeLabel={TAB_CONFIG[currentTab].badgeLabel}
                badgeColor={colors.primary}
                badgeTextColor={colors.white}
                onPress={() => goToCategory(section.categoryId)}
                style={{ width: TILE_WIDTH }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: colors.lightBackground, paddingVertical: spacing.lg },
  gridWrap: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});
