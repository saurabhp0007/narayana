import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { collectionApi } from '../../lib/api';
import { Collection, Product } from '../../types';
import { colors, badgeLabels, radius, shadow, spacing, fontDisplay } from '../../lib/theme';
import { Skeleton } from '../common/Skeleton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.38;

function ProductCardTile({ product }: { product: Product }) {
  const navigation = useNavigation();
  const price = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }]}
      activeOpacity={0.85}
      onPress={() =>
        navigation.dispatch(
          CommonActions.navigate({ name: 'Root', params: { screen: 'ProductDetail', params: { productId: product._id } } })
        )
      }
    >
      <View style={styles.imageWrap}>
        {product.images?.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={26} color={colors.border} />
          </View>
        )}

        {product.badge ? (
          <View style={[styles.badge, { backgroundColor: colors.badge[product.badge] ?? colors.primary }]}>
            <Text style={styles.badgeText}>{badgeLabels[product.badge] ?? product.badge}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {product.name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{price.toFixed(0)}</Text>
        {hasDiscount ? <Text style={styles.originalPrice}>₹{product.price.toFixed(0)}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function CollectionBlock({ collection }: { collection: Collection }) {
  const products = (collection.productIds as Product[]).filter((p) => typeof p === 'object');
  if (products.length === 0) return null;

  return (
    <View style={styles.block}>
      {collection.bannerImage ? (
        <View style={styles.bannerWrap}>
          <Image source={{ uri: collection.bannerImage }} style={styles.banner} contentFit="cover" />
        </View>
      ) : null}

      <Text style={styles.collectionName}>{collection.name}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardRow}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.sm}
      >
        {products.map((product) => (
          <ProductCardTile key={product._id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}

export function CollectionsSection() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    collectionApi
      .getActive()
      .then((res) => setCollections(res.data.data || res.data || []))
      .catch((err) => console.error('Failed to load collections:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleCollections = collections.filter((c) => (c.productIds as Product[])?.length > 0);

  if (!isLoading && visibleCollections.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>Narayan Enterprises</Text>
      <Text style={styles.heading}>Curated Collections</Text>

      {isLoading ? (
        <View>
          <Skeleton style={{ width: '100%', aspectRatio: 16 / 9 }} />
          <View style={[styles.cardRow, { paddingTop: spacing.md }]}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} style={{ width: CARD_WIDTH, aspectRatio: 4 / 5, borderRadius: radius.lg }} />
            ))}
          </View>
        </View>
      ) : (
        visibleCollections.map((collection) => <CollectionBlock key={collection._id} collection={collection} />)
      )}
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
    marginBottom: spacing.lg,
    fontFamily: fontDisplay,
  },
  block: { marginBottom: spacing.xl },
  bannerWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.lightBackground },
  banner: { width: '100%', height: '100%' },
  collectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cardRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  card: {},
  imageWrap: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.lightBackground,
    marginBottom: 8,
    ...shadow.sm,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  name: { fontSize: 13, fontWeight: '500', color: colors.primary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
  originalPrice: { fontSize: 12, color: colors.secondary, textDecorationLine: 'line-through' },
});
