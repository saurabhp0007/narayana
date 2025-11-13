import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
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
import offerService from '../../services/offer.service';
import { Gender, Category, Offer } from '../../types';
import SearchAutosuggest from '../../components/SearchAutosuggest';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<UserStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { featuredProducts, loading } = useAppSelector((state) => state.product);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      dispatch(fetchFeaturedProducts());
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      const [gendersData, categoriesData, offersData] = await Promise.all([
        genderService.getAll(),
        categoryService.getAll(),
        offerService.getActive(),
      ]);
      setGenders(gendersData.filter((g) => g.isActive));
      setCategories(categoriesData.filter((c) => c.isActive));
      setActiveOffers(offersData.filter((o) => offerService.isOfferValid(o)));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategoryPress = (genderId: string, categoryId?: string) => {
    navigation.navigate('ProductList', { genderId, categoryId });
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleSearchSubmit = (query: string) => {
    navigation.navigate('ProductList', { search: query });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Narayana Store</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="heart-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="cart-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <SearchAutosuggest
          onSelectProduct={handleProductPress}
          onSelectCategory={(id, name) => handleCategoryPress('', id)}
          onSearchSubmit={handleSearchSubmit}
          placeholder="Search products, categories..."
          containerStyle={styles.searchWrapper}
        />
      </View>

      {activeOffers.length > 0 && (
        <View style={styles.offersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎉 Active Offers</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
            {activeOffers.map((offer) => (
              <TouchableOpacity
                key={offer._id}
                style={[
                  styles.offerBanner,
                  { backgroundColor: offerService.getOfferBadgeColor(offer.offerType) },
                ]}
                onPress={() => navigation.navigate('ProductList', {})}
              >
                <View style={styles.offerBannerContent}>
                  <Ionicons name="pricetag" size={24} color="white" style={styles.offerIcon} />
                  <View style={styles.offerTextContainer}>
                    <Text style={styles.offerBannerTitle}>{offer.name}</Text>
                    <Text style={styles.offerBannerSubtitle}>
                      {offerService.formatOfferDescription(offer)}
                    </Text>
                    {offer.description && (
                      <Text style={styles.offerBannerDescription} numberOfLines={2}>
                        {offer.description}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
                  typeof category.genderId === 'string' ? category.genderId : category.genderId._id,
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
          <View style={styles.featuredProductsGrid}>
            {featuredProducts.slice(0, 6).map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.productGridCard}
                onPress={() => handleProductPress(item._id)}
              >
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: item.images[0] }} style={styles.productGridImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.productGridImage, styles.productImagePlaceholder]}>
                    <Ionicons name="image-outline" size={40} color="#999" />
                  </View>
                )}
                <View style={styles.productGridInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.priceRow}>
                    {item.discountPrice ? (
                      <>
                        <Text style={styles.productDiscountPriceGreen}>₹{item.discountPrice}</Text>
                        <Text style={styles.productOriginalPrice}>₹{item.price}</Text>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>
                            {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.productPrice}>₹{item.price}</Text>
                    )}
                  </View>
                  {item.stock <= 10 && item.stock > 0 && (
                    <View style={styles.lowStockBadge}>
                      <Text style={styles.lowStockText}>Only {item.stock} left</Text>
                    </View>
                  )}
                  {item.stock === 0 && (
                    <View style={styles.outOfStockBadge}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  searchWrapper: {
    marginBottom: 8,
  },
  offersSection: {
    paddingVertical: 16,
  },
  offersScroll: {
    paddingHorizontal: 16,
  },
  offerBanner: {
    width: 280,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  offerBannerContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  offerIcon: {
    marginRight: 12,
  },
  offerTextContainer: {
    flex: 1,
  },
  offerBannerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  offerBannerSubtitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  offerBannerDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
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
  featuredProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productGridCard: {
    width: width > 600 ? '32%' : '48%',
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
  productGridImage: {
    width: '100%',
    aspectRatio: 1,
  },
  productImagePlaceholder: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productGridInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    minHeight: 40,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  productPrice: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productDiscountPriceGreen: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productOriginalPrice: {
    color: '#999',
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  discountBadge: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  lowStockBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  lowStockText: {
    color: '#ff9800',
    fontSize: 11,
    fontWeight: '600',
  },
  outOfStockBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  outOfStockText: {
    color: '#f44336',
    fontSize: 11,
    fontWeight: '600',
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
