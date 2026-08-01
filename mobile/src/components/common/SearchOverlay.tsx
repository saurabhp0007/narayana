import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, radius, spacing } from '../../lib/theme';
import { productApi } from '../../lib/api';
import { useDataStore } from '../../store/dataStore';
import { Product } from '../../types';

const RECENT_KEY = 'recent_searches';
const { width } = Dimensions.get('window');
const TILE_WIDTH = (width - spacing.md * 2 - spacing.sm * 3) / 4;

export function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { featuredProducts, allSubcategories, fetchFeaturedProducts, fetchAllSubcategories } = useDataStore();

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(RECENT_KEY).then((v) => setRecent(v ? JSON.parse(v) : []));
      if (featuredProducts.length === 0) fetchFeaturedProducts(8);
      if (allSubcategories.length === 0) fetchAllSubcategories();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await productApi.getAll({ search: query, limit: 12, isActive: true });
        const data = response.data.data || response.data || [];
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const saveRecent = async (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const removeRecent = async (term: string) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const goToProduct = (product: Product) => {
    if (query.trim().length >= 2) saveRecent(query.trim());
    onClose();
    navigation.dispatch(
      CommonActions.navigate({ name: 'Root', params: { screen: 'ProductDetail', params: { productId: product._id } } })
    );
  };

  const showEmpty = query.length >= 2 && !isLoading && results.length === 0;
  const displayProducts = query.length >= 2 ? results : featuredProducts;
  const categoryChips = Array.from(new Set(allSubcategories.map((s) => s.name))).slice(0, 8);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent={false}>
      {/* Modal renders in its own native root on both platforms, so it doesn't
          reliably inherit the outer SafeAreaProvider — re-declare one here so
          useSafeAreaInsets()/SafeAreaView measure this root's own insets. */}
      <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={colors.secondary} />
            <TextInput
              autoFocus
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search products..."
              placeholderTextColor={colors.placeholder}
              returnKeyType="search"
              onSubmitEditing={() => query.trim().length >= 2 && saveRecent(query.trim())}
            />
            {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          contentContainerStyle={styles.scrollContent}
          data={[1]}
          keyExtractor={() => 'body'}
          keyboardShouldPersistTaps="handled"
          renderItem={() => (
            <View>
              {query.length < 2 && recent.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <View style={styles.chipRow}>
                    {recent.map((term) => (
                      <View key={term} style={styles.recentChip}>
                        <TouchableOpacity onPress={() => setQuery(term)}>
                          <Text style={styles.recentChipText}>{term}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeRecent(term)} hitSlop={6}>
                          <Ionicons name="close" size={14} color={colors.secondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {query.length < 2 && categoryChips.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Popular Categories</Text>
                  <View style={styles.chipRow}>
                    {categoryChips.map((name) => (
                      <TouchableOpacity
                        key={name}
                        style={styles.categoryChip}
                        onPress={() => setQuery(name)}
                      >
                        <Text style={styles.categoryChipText}>{name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}

              {showEmpty ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No products found for "{query}"</Text>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {query.length >= 2 ? 'Results' : showEmpty ? 'Trending Products' : 'Featured Products'}
                </Text>
                <View style={styles.grid}>
                  {(showEmpty ? featuredProducts : displayProducts).map((product) => (
                    <TouchableOpacity
                      key={product._id}
                      style={[styles.tile, { width: TILE_WIDTH }]}
                      onPress={() => goToProduct(product)}
                    >
                      <Image
                        source={{ uri: product.images[0] }}
                        style={[styles.tileImage, { width: TILE_WIDTH, height: TILE_WIDTH * 1.25 }]}
                        contentFit="cover"
                      />
                      <Text style={styles.tileName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.tilePrice}>₹{(product.discountPrice || product.price).toFixed(0)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lightBackground,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 15, color: colors.primary },
  cancel: { fontSize: 14, color: colors.info, fontWeight: '600' },
  scrollContent: { padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  recentChipText: { fontSize: 13, color: colors.primary },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  categoryChipText: { fontSize: 13, color: colors.primary },
  emptyBox: { paddingVertical: spacing.md },
  emptyText: { fontSize: 14, color: colors.secondary, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {},
  tileImage: { borderRadius: radius.md, backgroundColor: colors.lightBackground },
  tileName: { fontSize: 12, color: colors.primary, marginTop: 6, lineHeight: 15 },
  tilePrice: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 2 },
});
