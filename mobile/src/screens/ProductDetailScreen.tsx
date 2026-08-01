import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import api, { productApi } from '../lib/api';
import { Product } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ProductCard } from '../components/common/ProductCard';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useToastStore } from '../store/toastStore';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = ({ navigation, route }: any) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/products/${productId}`);
      const fetchedProduct = response.data.data || response.data;
      setProduct(fetchedProduct);

      // Fetch the product's actual related products (falls back to featured
      // products if none are configured, so the section isn't empty)
      if (fetchedProduct.relatedProductIds?.length > 0) {
        const relatedResponse = await productApi.getAll({
          productIds: fetchedProduct.relatedProductIds.join(','),
        });
        setRelatedProducts(relatedResponse.data.data || relatedResponse.data);
      } else {
        const featuredResponse = await api.get('/products/featured', { params: { limit: 4 } });
        setRelatedProducts(featuredResponse.data.data || featuredResponse.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(productId, quantity);
      showToast('Added to cart!', 'success');
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

  const handleAddToWishlist = async () => {
    try {
      await addToWishlist(productId);
      showToast('Added to wishlist!', 'success');
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

  if (isLoading || !product) {
    return <LoadingSpinner />;
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const savings = hasDiscount ? product.price - product.discountPrice! : 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Product Details"
        rightSlot={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Wishlist')} hitSlop={8}>
              <Ionicons name="heart-outline" size={22} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} hitSlop={8}>
              <Ionicons name="cart-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>
            Home {'>'} Products {'>'} {typeof product.categoryId === 'object' ? product.categoryId.name : 'Category'} {'>'} {product.name}
          </Text>
        </View>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[selectedImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercentage}%</Text>
            </View>
          )}
        </View>

        {/* Thumbnail Strip */}
        {product.images.length > 1 && (
          <FlatList
            data={product.images}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailList}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => setSelectedImageIndex(index)}
                style={[
                  styles.thumbnailContainer,
                  selectedImageIndex === index && styles.selectedThumbnail,
                ]}
              >
                <Image source={{ uri: item }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}
          />
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.sku}>SKU: {product.sku}</Text>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>
              ₹{(product.discountPrice || product.price).toFixed(2)}
            </Text>
            {hasDiscount && (
              <>
                <Text style={styles.originalPrice}>₹{product.price.toFixed(2)}</Text>
                <Text style={styles.savingsText}>You save ₹{savings.toFixed(2)}</Text>
              </>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockStatus}>
            {product.stock > 0 ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.inStock}>In Stock ({product.stock} available)</Text>
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
                <Text style={styles.outOfStock}>Out of Stock</Text>
              </>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.sizeSection}>
              <Text style={styles.sectionLabel}>Select Size</Text>
              <View style={styles.sizeOptions}>
                {product.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeButton, selectedSize === size && styles.selectedSize]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[styles.sizeText, selectedSize === size && styles.selectedSizeText]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.addToCartButton, product.stock === 0 && styles.disabledButton]}
              onPress={handleAddToCart}
              disabled={product.stock === 0}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.wishlistButton} onPress={handleAddToWishlist}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Products</Text>
            <FlatList
              data={relatedProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.relatedItem}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.push('ProductDetail', { productId: item._id })}
                    onAddToCart={() => addToCart(item._id, 1)}
                  />
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  breadcrumb: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.lightBackground,
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.secondary,
  },
  imageContainer: {
    aspectRatio: 0.8,
    backgroundColor: colors.lightBackground,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  thumbnailList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnailContainer: {
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  selectedThumbnail: {
    borderColor: colors.primary,
  },
  thumbnail: {
    width: 60,
    height: 75,
    borderRadius: 6,
    backgroundColor: colors.lightBackground,
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  sku: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 16,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: colors.secondary,
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  inStock: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  outOfStock: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 22,
  },
  sizeSection: {
    marginBottom: 16,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectedSize: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  selectedSizeText: {
    color: '#fff',
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wishlistButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedSection: {
    paddingVertical: 24,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  relatedItem: {
    width: (width - 48) / 2,
    marginLeft: 16,
  },
});
