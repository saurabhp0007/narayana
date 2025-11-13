import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import productService from '../../services/product.service';
import { Product } from '../../types';

type ProductDetailRouteProp = RouteProp<UserStackParamList, 'ProductDetail'>;
type NavigationProp = NativeStackNavigationProp<UserStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { wishlist } = useAppSelector((state) => state.wishlist);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = () => {
    if (!product || !wishlist || !wishlist.items) return false;
    return wishlist.items.some((item) => item.product._id === product._id);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      return;
    }
    try {
      await dispatch(addToCart({ productId: product._id, quantity })).unwrap();
      Alert.alert('Success', 'Product added to cart', [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Main', { screen: 'Cart' } as any) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to add to cart');
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    try {
      if (isInWishlist()) {
        const wishlistItem = wishlist?.items.find((item) => item.product._id === product._id);
        if (wishlistItem) {
          await dispatch(removeFromWishlist(wishlistItem._id)).unwrap();
        }
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
      }
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to update wishlist');
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <View style={styles.imageGallery}>
        {product.images && product.images.length > 0 ? (
          <>
            <Image
              source={{ uri: product.images[selectedImage] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {product.images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailContainer}
              >
                {product.images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImage(index)}
                    style={[
                      styles.thumbnail,
                      selectedImage === index && styles.thumbnailActive,
                    ]}
                  >
                    <Image source={{ uri: image }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color="#999" />
          </View>
        )}
        <TouchableOpacity style={styles.wishlistButton} onPress={handleWishlistToggle}>
          <Ionicons
            name={isInWishlist() ? 'heart' : 'heart-outline'}
            size={28}
            color={isInWishlist() ? '#f44336' : '#333'}
          />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>₹{product.price}</Text>
          {product.discountedPrice && (
            <>
              <Text style={styles.productDiscountPrice}>₹{product.discountedPrice}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Stock Status */}
        <View style={styles.stockContainer}>
          {product.stock === 0 ? (
            <View style={styles.outOfStockBadge}>
              <Ionicons name="close-circle" size={16} color="#f44336" />
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          ) : product.stock <= 10 ? (
            <View style={styles.lowStockBadge}>
              <Ionicons name="warning" size={16} color="#ff9800" />
              <Text style={styles.lowStockText}>Only {product.stock} left in stock</Text>
            </View>
          ) : (
            <View style={styles.inStockBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
              <Text style={styles.inStockText}>In Stock</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SKU:</Text>
            <Text style={styles.detailValue}>{product.sku}</Text>
          </View>
          {product.familySKU && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Family SKU:</Text>
              <Text style={styles.detailValue}>{product.familySKU}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender:</Text>
            <Text style={styles.detailValue}>
              {typeof product.genderId === 'string' ? product.genderId : product.genderId.name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {typeof product.categoryId === 'string' ? product.categoryId : product.categoryId.name}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {product.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Bottom Spacer */}
      <View style={{ height: 100 }} />

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={quantity <= 1 ? '#ccc' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={incrementQuantity}
            disabled={!product || quantity >= product.stock}
          >
            <Ionicons
              name="add"
              size={20}
              color={!product || quantity >= product.stock ? '#ccc' : '#333'}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, product.stock === 0 && styles.addToCartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Ionicons name="cart" size={20} color="white" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
  },
  imageGallery: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  mainImage: {
    width: width,
    height: width,
  },
  imagePlaceholder: {
    width: width,
    height: width,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailContainer: {
    padding: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#6200ee',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  productInfo: {
    backgroundColor: 'white',
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  productDiscountPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  discountBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stockContainer: {
    marginBottom: 16,
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  inStockText: {
    color: '#4caf50',
    fontWeight: '600',
    marginLeft: 4,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lowStockText: {
    color: '#ff9800',
    fontWeight: '600',
    marginLeft: 4,
  },
  outOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  outOfStockText: {
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e1bee7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#6200ee',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;
