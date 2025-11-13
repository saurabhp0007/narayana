import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserStackParamList } from '../../navigation/UserNavigator';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchCart, clearCart } from '../../store/slices/cartSlice';
import orderService from '../../services/order.service';
import { CreateOrderDto, ShippingAddress } from '../../types';

type NavigationProp = NativeStackNavigationProp<UserStackParamList, 'Checkout'>;

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((state) => state.cart);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ShippingAddress & { name: string; email: string }>({
    name: '',
    email: '',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  useEffect(() => {
    dispatch(fetchCart());
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter shipping full name');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.addressLine1.trim()) {
      Alert.alert('Error', 'Please enter address');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter city');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter state');
      return false;
    }
    if (!formData.postalCode.trim()) {
      Alert.alert('Error', 'Please enter postal code');
      return false;
    }
    if (!/^\d{6}$/.test(formData.postalCode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit postal code');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const orderData: CreateOrderDto = {
        user: {
          name: formData.name,
          email: formData.email,
        },
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
      };

      const order = await orderService.create(orderData);
      await dispatch(clearCart()).unwrap();
      navigation.replace('OrderSuccess', { orderId: order._id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Your cart is empty</Text>
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Recipient Full Name"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Address Line 1"
              value={formData.addressLine1}
              onChangeText={(value) => handleInputChange('addressLine1', value)}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Address Line 2 (Optional)"
              value={formData.addressLine2}
              onChangeText={(value) => handleInputChange('addressLine2', value)}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Ionicons name="map-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="State"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              value={formData.postalCode}
              onChangeText={(value) => handleInputChange('postalCode', value)}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.items.map((item) => (
            <View key={item._id} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>
                {item.product.name} x {item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>₹{item.itemTotal}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({cart.summary.totalItems} items)</Text>
            <Text style={styles.totalAmount}>₹{cart.summary.total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order (₹{cart.summary.total})</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
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
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;
