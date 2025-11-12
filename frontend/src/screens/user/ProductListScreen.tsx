import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserStackParamList } from '../../navigation/UserNavigator';
import productService from '../../services/product.service';
import genderService from '../../services/gender.service';
import categoryService from '../../services/category.service';
import subcategoryService from '../../services/subcategory.service';
import { Product, Gender, Category, Subcategory, ProductFilters } from '../../types';

type NavigationProp = NativeStackNavigationProp<UserStackParamList, 'ProductList'>;
type ProductListRouteProp = RouteProp<UserStackParamList, 'ProductList'>;

const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProductListRouteProp>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedGender, setSelectedGender] = useState<string | undefined>(route.params?.genderId);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(route.params?.categoryId);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(route.params?.subcategoryId);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedGender, selectedCategory, selectedSubcategory, sortBy]);

  useEffect(() => {
    if (selectedGender) {
      loadCategoriesByGender(selectedGender);
    }
  }, [selectedGender]);

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategoriesByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [gendersData, categoriesData, subcategoriesData] = await Promise.all([
        genderService.getAll(),
        categoryService.getAll(),
        subcategoryService.getAll(),
      ]);
      setGenders(gendersData.filter((g) => g.isActive));
      setCategories(categoriesData.filter((c) => c.isActive));
      setSubcategories(subcategoriesData.filter((s) => s.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCategoriesByGender = async (genderId: string) => {
    try {
      const categoriesData = await categoryService.getByGender(genderId);
      setCategories(categoriesData.filter((c) => c.isActive));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubcategoriesByCategory = async (categoryId: string) => {
    try {
      const subcategoriesData = await subcategoryService.getByCategory(categoryId);
      setSubcategories(subcategoriesData.filter((s) => s.isActive));
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters: ProductFilters = {
        gender: selectedGender,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        sortBy: sortBy === 'price-asc' || sortBy === 'price-desc' ? 'price' : 'name',
        sortOrder: sortBy === 'price-desc' ? 'desc' : 'asc',
      };
      const response = await productService.getAll(filters);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    loadProducts();
  };

  const clearFilters = () => {
    setSelectedGender(undefined);
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setSortBy('name');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
    >
      {item.images && item.images.length > 0 ? (
        <Image source={{ uri: item.images[0] }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#999" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          {item.discountedPrice && (
            <Text style={styles.productDiscountPrice}>₹{item.discountedPrice}</Text>
          )}
        </View>
        {item.stock <= 10 && item.stock > 0 && (
          <Text style={styles.lowStockText}>Only {item.stock} left!</Text>
        )}
        {item.stock === 0 && <Text style={styles.outOfStockText}>Out of Stock</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color="#6200ee" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No products found</Text>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Gender Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Gender</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {genders.map((gender) => (
                    <TouchableOpacity
                      key={gender._id}
                      style={[
                        styles.filterChip,
                        selectedGender === gender._id && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedGender(gender._id)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedGender === gender._id && styles.filterChipTextActive,
                        ]}
                      >
                        {gender.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.filterChip,
                        selectedCategory === category._id && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCategory(category._id)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCategory === category._id && styles.filterChipTextActive,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Subcategory Filter */}
              {selectedCategory && subcategories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Subcategory</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {subcategories.map((subcategory) => (
                      <TouchableOpacity
                        key={subcategory._id}
                        style={[
                          styles.filterChip,
                          selectedSubcategory === subcategory._id && styles.filterChipActive,
                        ]}
                        onPress={() => setSelectedSubcategory(subcategory._id)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedSubcategory === subcategory._id && styles.filterChipTextActive,
                          ]}
                        >
                          {subcategory.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sort By</Text>
                <View style={styles.sortOptions}>
                  {[
                    { value: 'name', label: 'Name' },
                    { value: 'price-asc', label: 'Price: Low to High' },
                    { value: 'price-desc', label: 'Price: High to Low' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortOption,
                        sortBy === option.value && styles.sortOptionActive,
                      ]}
                      onPress={() => setSortBy(option.value as any)}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortBy === option.value && styles.sortOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <Ionicons name="checkmark" size={20} color="#6200ee" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  productList: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productDiscountPrice: {
    color: '#999',
    textDecorationLine: 'line-through',
    fontSize: 12,
    marginLeft: 8,
  },
  lowStockText: {
    color: '#ff9800',
    fontSize: 12,
  },
  outOfStockText: {
    color: '#f44336',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6200ee',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: '#e1bee7',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
  },
  sortOptionTextActive: {
    color: '#6200ee',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6200ee',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ProductListScreen;
