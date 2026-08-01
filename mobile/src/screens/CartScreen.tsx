import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../lib/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ScreenHeader } from '../components/common/ScreenHeader';

export const CartScreen = ({ navigation }: any) => {
  const { items, summary, isLoading, fetchCart, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(itemId) },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to clear your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearCart();
            Alert.alert('Success', 'Your cart has been cleared');
          } catch (error: any) {
            console.error('Error clearing cart:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to clear cart');
          }
        }
      },
    ]);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout');
      return;
    }

    if (!user) {
      Alert.alert('Please Login', 'You need to login to place an order');
      navigation.navigate('Login');
      return;
    }

    setIsCheckingOut(true);
    try {
      // Create order with empty object (like frontend does)
      const response = await orderApi.create({});

      console.log('Order response:', response.data);

      // Show success message with orderId
      const orderId = response.data.orderId || response.data._id || response.data.id;
      Alert.alert('Order Placed', `Your order #${orderId} has been placed successfully!`, [
        {
          text: 'OK',
          onPress: async () => {
            try {
              // Clear cart and navigate to orders
              await clearCart();
              navigation.navigate('Orders');
            } catch (err) {
              console.error('Error clearing cart:', err);
              navigation.navigate('Orders');
            }
          }
        }
      ]);
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to place order. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Shopping Cart" />
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={colors.secondary} />
          <Text style={styles.emptyTitle}>Please Login</Text>
          <Text style={styles.emptyText}>Login to view your cart</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && items.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Shopping Cart" />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={colors.secondary} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some products to get started</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <View key={item._id} style={styles.cartItem}>
                <Image source={{ uri: item.product.images[0] }} style={styles.productImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.productSku}>SKU: {item.product.sku}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>₹{item.itemTotal.toFixed(2)}</Text>
                    {item.productDiscount > 0 && (
                      <Text style={styles.discountText}>-₹{item.productDiscount.toFixed(2)}</Text>
                    )}
                  </View>
                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveItem(item._id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Cart Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
              <Text style={styles.summaryValue}>₹{summary.subtotal.toFixed(2)}</Text>
            </View>
            {summary.totalDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.discountLabel}>Total Discount</Text>
                <Text style={styles.discountValue}>-₹{summary.totalDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{summary.total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, isCheckingOut && { opacity: 0.6 }]}
              onPress={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  productImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.lightBackground,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  productSku: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  discountText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  removeBtn: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.secondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  discountLabel: {
    fontSize: 14,
    color: colors.success,
  },
  discountValue: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: colors.secondary,
    fontSize: 14,
  },
});
