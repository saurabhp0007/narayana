import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAppDispatch, useAppSelector } from '../../store/store';
import {
  fetchWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { WishlistItem } from '../../types';

type NavigationProp = NativeStackNavigationProp<UserStackParamList>;

const WishlistScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { wishlist, loading } = useAppSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, []);

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Remove from Wishlist', 'Remove this item from your wishlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(removeFromWishlist(itemId)).unwrap();
          } catch (error: any) {
            Alert.alert('Error', error || 'Failed to remove item');
          }
        },
      },
    ]);
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    if (item.product.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      return;
    }
    try {
      await dispatch(addToCart({ productId: item.product._id, quantity: 1 })).unwrap();
      await dispatch(removeFromWishlist(item._id)).unwrap();
      Alert.alert('Success', 'Product moved to cart');
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to move to cart');
    }
  };

  const handleClearWishlist = () => {
    Alert.alert('Clear Wishlist', 'Are you sure you want to clear your wishlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(clearWishlist()).unwrap();
          } catch (error: any) {
            Alert.alert('Error', error || 'Failed to clear wishlist');
          }
        },
      },
    ]);
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity
        style={styles.productImageContainer}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product._id })}
      >
        {item.product.images && item.product.images.length > 0 ? (
          <Image
            source={{ uri: item.product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#999" />
          </View>
        )}
        {item.product.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.itemDetails}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.product.price}</Text>
          {item.product.discountedPrice && (
            <Text style={styles.productDiscountPrice}>₹{item.product.discountedPrice}</Text>
          )}
        </View>
        {item.product.stock > 0 && item.product.stock <= 10 && (
          <Text style={styles.lowStockText}>Only {item.product.stock} left!</Text>
        )}
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[
              styles.moveToCartButton,
              item.product.stock === 0 && styles.moveToCartButtonDisabled,
            ]}
            onPress={() => handleMoveToCart(item)}
            disabled={item.product.stock === 0}
          >
            <Ionicons name="cart-outline" size={16} color="white" />
            <Text style={styles.moveToCartText}>Move to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item._id)}
          >
            <Ionicons name="trash-outline" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading wishlist...</Text>
      </View>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
        <Text style={styles.emptySubtext}>Save items you like for later</Text>
        <TouchableOpacity
          style={styles.shopNowButton}
          onPress={() => navigation.navigate('Main', { screen: 'Home' } as any)}
        >
          <Text style={styles.shopNowText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Wishlist ({wishlist.totalItems} {wishlist.totalItems === 1 ? 'item' : 'items'})
        </Text>
        {wishlist.items.length > 0 && (
          <TouchableOpacity onPress={handleClearWishlist}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={wishlist.items}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  productDiscountPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  lowStockText: {
    color: '#ff9800',
    fontSize: 12,
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moveToCartButton: {
    flex: 1,
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    marginRight: 8,
  },
  moveToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
  moveToCartText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
});

export default WishlistScreen;
