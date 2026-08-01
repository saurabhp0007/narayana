import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { footwearSubcategoryApi } from '../../lib/api';
import { FootwearSubcategory } from '../../types';
import { ProductGridSkeleton } from '../common/Skeleton';
import { Tabs } from '../common/Tabs';
import { colors, radius, spacing, fontDisplay } from '../../lib/theme';

const { width } = Dimensions.get('window');
const COLUMNS = 2;
const GAP = spacing.md;
const TILE_WIDTH = (width - spacing.md * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

export function FootwearSection() {
  const navigation = useNavigation();
  const [tabNames, setTabNames] = useState<string[]>([]);
  const [subcategoriesByTab, setSubcategoriesByTab] = useState<Record<string, FootwearSubcategory[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    footwearSubcategoryApi
      .getActive()
      .then((res) => {
        const subcategories: FootwearSubcategory[] = res.data.data || res.data || [];
        const seenTabs: string[] = [];
        const grouped: Record<string, FootwearSubcategory[]> = {};
        for (const subcategory of subcategories) {
          for (const tabName of subcategory.tabNames || []) {
            if (!grouped[tabName]) seenTabs.push(tabName);
            (grouped[tabName] ||= []).push(subcategory);
          }
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

  const goToSubcategory = (subcategory: FootwearSubcategory) => {
    navigation.dispatch(
      CommonActions.navigate({ name: 'Root', params: { screen: 'Products', params: { subcategoryId: subcategory._id } } })
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Footwear</Text>

      <Tabs
        tabs={tabNames.map((name) => ({ id: name, label: name }))}
        activeId={currentTab}
        onChange={setActiveTab}
        variant="underline"
      />

      <View style={styles.gridWrap}>
        {isLoading ? (
          <ProductGridSkeleton count={8} columns={COLUMNS} />
        ) : (
          <View style={styles.grid}>
            {currentSubcategories.map((subcategory) => (
              <TouchableOpacity
                key={subcategory._id}
                style={[styles.tile, { width: TILE_WIDTH }]}
                onPress={() => goToSubcategory(subcategory)}
                activeOpacity={0.85}
              >
                <View style={styles.imageWrap}>
                  {subcategory.image ? (
                    <Image source={{ uri: subcategory.image }} style={styles.image} contentFit="cover" />
                  ) : (
                    <View style={styles.placeholder}>
                      <Ionicons name="image-outline" size={32} color={colors.border} />
                    </View>
                  )}
                  {subcategory.offerText ? (
                    <View style={styles.offerBadge}>
                      <Text style={styles.offerBadgeText}>{subcategory.offerText}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tileName} numberOfLines={1}>
                  {subcategory.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: colors.white, paddingVertical: spacing.lg },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fontDisplay,
  },
  gridWrap: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {},
  imageWrap: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.lightBackground,
    marginBottom: 8,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  offerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  offerBadgeText: { color: colors.white, fontSize: 10, fontWeight: '600' },
  tileName: { fontSize: 13, fontWeight: '500', color: colors.primary },
});
