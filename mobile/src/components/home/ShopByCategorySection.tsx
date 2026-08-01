import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { shopSubcategoryApi } from '../../lib/api';
import { ShopSubcategory, ShopCategory } from '../../types';
import { ProductGridSkeleton } from '../common/Skeleton';
import { Tabs } from '../common/Tabs';
import { colors, radius, spacing, fontDisplay } from '../../lib/theme';

const { width } = Dimensions.get('window');
const COLUMNS = 2;
const GAP = spacing.md;
const TILE_WIDTH = (width - spacing.md * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

export function ShopByCategorySection() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [subcategoriesByCategoryId, setSubcategoriesByCategoryId] = useState<Record<string, ShopSubcategory[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState('');

  useEffect(() => {
    shopSubcategoryApi
      .getActive()
      .then((res) => {
        const subcategories: ShopSubcategory[] = res.data.data || res.data || [];
        const categoryById = new Map<string, ShopCategory>();
        const grouped: Record<string, ShopSubcategory[]> = {};

        for (const subcategory of subcategories) {
          const category = subcategory.shopCategoryId;
          if (!category || typeof category === 'string') continue;
          if (!categoryById.has(category._id)) categoryById.set(category._id, category);
          (grouped[category._id] ||= []).push(subcategory);
        }

        setCategories(Array.from(categoryById.values()).sort((a, b) => a.displayOrder - b.displayOrder));
        setSubcategoriesByCategoryId(grouped);
      })
      .catch((err) => console.error('Failed to load shop subcategories:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && categories.length === 0) return null;

  const currentCategoryId = categories.some((c) => c._id === activeCategoryId) ? activeCategoryId : categories[0]?._id;
  const currentSubcategories = currentCategoryId ? subcategoriesByCategoryId[currentCategoryId] || [] : [];

  const goToSubcategory = (subcategory: ShopSubcategory) => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Root',
        params: { screen: 'Products', params: { shopSubcategorySlug: subcategory.slug } },
      })
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>Narayan Enterprises</Text>
      <Text style={styles.heading}>Shop by Category</Text>

      <Tabs
        tabs={categories.map((c) => ({ id: c._id, label: c.name }))}
        activeId={currentCategoryId}
        onChange={setActiveCategoryId}
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
  eyebrow: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.placeholder,
    marginBottom: 4,
  },
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
