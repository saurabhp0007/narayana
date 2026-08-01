import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { productApi } from '../lib/api';
import { Product, Gender, Category, Subcategory } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { SearchBar } from '../components/common/SearchBar';
import { CustomBottomSheet } from '../components/common/CustomBottomSheet';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useDataStore } from '../store/dataStore';
import { useToastStore } from '../store/toastStore';

const { width } = Dimensions.get('window');

export const ProductsScreen = ({ navigation, route }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [selectedGender, setSelectedGender] = useState(route.params?.genderId || '');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.categoryId || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(route.params?.subcategoryId || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState(route.params?.search || '');
  const [productIds, setProductIds] = useState(route.params?.productIds || '');

  const { genders, allSubcategories, categoriesByGender, fetchGenders, fetchAllSubcategories, fetchCategoriesByGender } = useDataStore();
  const { addToCart } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    fetchGenders();
    fetchAllSubcategories();
  }, []);

  useEffect(() => {
    if (selectedGender) {
      fetchCategoriesByGender(selectedGender);
    }
  }, [selectedGender]);

  const fetchProducts = useCallback(async (pageNum = 1) => {
    setIsLoading(pageNum === 1);
    try {
      const params: any = {
        page: pageNum,
        limit: 10,
        isActive: true,
      };

      if (selectedGender) params.genderId = selectedGender;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedSubcategory) params.subcategoryId = selectedSubcategory;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (searchQuery) params.search = searchQuery;
      if (productIds) params.productIds = productIds;

      const response = await productApi.getAll(params);
      const data = response.data;
      const productsData = data.data || data.products || data;

      if (pageNum === 1) {
        setProducts(productsData);
      } else {
        setProducts((prev) => [...prev, ...productsData]);
      }
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedGender, selectedCategory, selectedSubcategory, minPrice, maxPrice, searchQuery, productIds]);

  useEffect(() => {
    fetchProducts(1);
    setPage(1);
  }, [selectedGender, selectedCategory, selectedSubcategory, minPrice, maxPrice]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      showToast('Added to cart successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 401) {
        showToast('Please login to add items to cart', 'info');
        navigation.navigate('Login');
      } else {
        showToast('Failed to add to cart. Please try again.', 'error');
      }
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    try {
      await addToWishlist(productId);
      showToast('Added to wishlist successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      if (error.response?.status === 401) {
        showToast('Please login to add items to wishlist', 'info');
        navigation.navigate('Login');
      } else {
        showToast('Failed to add to wishlist. Please try again.', 'error');
      }
    }
  };

  const clearFilters = () => {
    setSelectedGender('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  const genderOptions = [
    { label: 'All Genders', value: '' },
    ...genders.map((g) => ({ label: g.name, value: g._id })),
  ];

  const categories = selectedGender ? (categoriesByGender[selectedGender] || []) : [];
  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...categories.map((c) => ({ label: c.name, value: c._id })),
  ];

  const subcategoryOptions = [
    { label: 'All Subcategories', value: '' },
    ...allSubcategories
      .filter((s) => {
        const catId = typeof s.categoryId === 'string' ? s.categoryId : s.categoryId._id;
        return !selectedCategory || catId === selectedCategory;
      })
      .map((s) => ({ label: s.name, value: s._id })),
  ];

  if (isLoading && products.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={route.params?.title || 'Products'}
        rightSlot={
          <TouchableOpacity onPress={() => setShowFilters(true)} hitSlop={10}>
            <Ionicons name="filter-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar onProductSelect={(id) => navigation.navigate('ProductDetail', { productId: id })} />
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.quickFilterChip, !selectedSubcategory && styles.activeChip]}
          onPress={() => setSelectedSubcategory('')}
        >
          <Text style={[styles.chipText, !selectedSubcategory && styles.activeChipText]}>All</Text>
        </TouchableOpacity>
        {allSubcategories.slice(0, 4).map((sub) => (
          <TouchableOpacity
            key={sub._id}
            style={[styles.quickFilterChip, selectedSubcategory === sub._id && styles.activeChip]}
            onPress={() => setSelectedSubcategory(sub._id)}
          >
            <Text style={[styles.chipText, selectedSubcategory === sub._id && styles.activeChipText]}>
              {sub.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
              onAddToCart={() => handleAddToCart(item._id)}
              onAddToWishlist={() => handleAddToWishlist(item._id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.secondary} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      {/* Filter Bottom Sheet */}
      <CustomBottomSheet visible={showFilters} onClose={() => setShowFilters(false)} title="Filters">
        <View style={styles.filterContent}>
          <CustomDropdown
            label="Gender"
            options={genderOptions}
            selectedValue={selectedGender}
            onSelect={setSelectedGender}
            placeholder="Select Gender"
          />
          <CustomDropdown
            label="Category"
            options={categoryOptions}
            selectedValue={selectedCategory}
            onSelect={setSelectedCategory}
            placeholder="Select Category"
          />
          <CustomDropdown
            label="Subcategory"
            options={subcategoryOptions}
            selectedValue={selectedSubcategory}
            onSelect={setSelectedSubcategory}
            placeholder="Select Subcategory"
          />

          <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  activeChipText: {
    color: '#fff',
  },
  productList: {
    paddingHorizontal: 12,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productItem: {
    width: (width - 48) / 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.secondary,
  },
  filterContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: colors.secondary,
    fontSize: 16,
  },
});
