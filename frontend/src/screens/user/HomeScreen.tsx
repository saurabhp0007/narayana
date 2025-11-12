import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchFeaturedProducts } from '../../store/slices/productSlice';
import { fetchCart } from '../../store/slices/cartSlice';
import { fetchWishlist } from '../../store/slices/wishlistSlice';
import genderService from '../../services/gender.service';
import categoryService from '../../services/category.service';
import { Gender, Category } from '../../types';

type NavigationProp = NativeStackNavigationProp<UserStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { featuredProducts, loading } = useAppSelector((state) => state.product);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      dispatch(fetchFeaturedProducts());
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      const [gendersData, categoriesData] = await Promise.all([
        genderService.getAll(),
        categoryService.getAll(),
      ]);
      setGenders(gendersData.filter((g) => g.isActive));
      setCategories(categoriesData.filter((c) => c.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('ProductList', {});
    }
  };

  const handleCategoryPress = (genderId: string, categoryId?: string) => {
    navigation.navigate('ProductList', { genderId, categoryId });
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>eCommerce</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop by Gender</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {genders.map((gender) => (
            <TouchableOpacity
              key={gender._id}
              style={styles.genderItem}
              onPress={() => handleCategoryPress(gender._id)}
            >
              <View style={styles.genderIconContainer}>
                <Ionicons name="person" size={32} color="#6200ee" />
              </View>
              <Text style={styles.genderName}>{gender.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProductList', {})}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesGrid}>
          {categories.slice(0, 6).map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryCard}
              onPress={() =>
                handleCategoryPress(
                  typeof category.gender === 'string' ? category.gender : category.gender._id,
                  category._id
                )
              }
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons name="grid" size={24} color="#2196f3" />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProductList', {})}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <FlatList
            data={featuredProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => handleProductPress(item._id)}
              >
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: item.images[0] }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#999" />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>₹{item.price}</Text>
                    {item.discountedPrice && (
                      <Text style={styles.productDiscountPrice}>₹{item.discountedPrice}</Text>
                    )}
                  </View>
                  {item.stock <= 10 && item.stock > 0 && (
                    <Text style={styles.lowStockText}>Only {item.stock} left!</Text>
                  )}
                  {item.stock === 0 && (
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Special Offer!</Text>
        <Text style={styles.bannerSubtitle}>Get up to 50% off on selected items</Text>
        <TouchableOpacity
          style={styles.bannerButton}
          onPress={() => navigation.navigate('ProductList', {})}
        >
          <Text style={styles.bannerButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    color: '#6200ee',
    fontWeight: '600',
    fontSize: 14,
  },
  horizontalScroll: {
    marginTop: 12,
  },
  genderItem: {
    marginRight: 16,
    alignItems: 'center',
  },
  genderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e1bee7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  genderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#bbdefb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 32,
    color: '#666',
    fontSize: 16,
  },
  productCard: {
    marginRight: 16,
    width: 160,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 160,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 160,
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
    marginTop: 4,
  },
  outOfStockText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#9c27b0',
    borderRadius: 12,
    padding: 24,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerSubtitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#9c27b0',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HomeScreen;
