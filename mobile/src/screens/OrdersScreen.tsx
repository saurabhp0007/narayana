import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import api from '../lib/api';
import { Order } from '../types';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { useAuthStore } from '../store/authStore';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: colors.statusPending,
  confirmed: colors.statusConfirmed,
  shipped: colors.statusShipped,
  delivered: colors.statusDelivered,
  cancelled: colors.statusCancelled,
};

export const OrdersScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders', { params: { limit: 100 } });
      const data = response.data.data || response.data;
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (statusFilter) {
      setFilteredOrders(orders.filter((order) => order.status === statusFilter));
    } else {
      setFilteredOrders(orders);
    }
  }, [statusFilter, orders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const statusOptions = [
    { label: 'All Orders', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Orders" />
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={colors.secondary} />
          <Text style={styles.emptyTitle}>Please Login</Text>
          <Text style={styles.emptyText}>Login to view your orders</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Orders" />

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <CustomDropdown
          options={statusOptions}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
          placeholder="Filter by status"
        />
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={colors.secondary} />
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptyText}>
            {statusFilter ? 'No orders with this status' : 'You have not placed any orders yet'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          {filteredOrders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{order.orderId}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status].bg }]}>
                  <Text style={[styles.statusText, { color: statusColors[order.status].text }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Image source={{ uri: item.images?.[0] }} style={styles.itemImage} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {/* Order Summary */}
              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{order.subtotal.toFixed(2)}</Text>
                </View>
                {order.discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.discountLabel}>Discount</Text>
                    <Text style={styles.discountValue}>-₹{order.discount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{order.totalAmount.toFixed(2)}</Text>
                </View>
              </View>

              {/* Additional Info */}
              {(order.shippingAddress || order.contactEmail || order.contactPhone || order.notes) && (
                <View style={styles.additionalInfo}>
                  {order.shippingAddress && (
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={16} color={colors.secondary} />
                      <Text style={styles.infoText}>{order.shippingAddress}</Text>
                    </View>
                  )}
                  {order.contactEmail && (
                    <View style={styles.infoRow}>
                      <Ionicons name="mail-outline" size={16} color={colors.secondary} />
                      <Text style={styles.infoText}>{order.contactEmail}</Text>
                    </View>
                  )}
                  {order.contactPhone && (
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={16} color={colors.secondary} />
                      <Text style={styles.infoText}>{order.contactPhone}</Text>
                    </View>
                  )}
                  {order.notes && (
                    <View style={styles.infoRow}>
                      <Ionicons name="document-text-outline" size={16} color={colors.secondary} />
                      <Text style={styles.infoText}>{order.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  orderDate: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 50,
    height: 62,
    borderRadius: 6,
    backgroundColor: colors.lightBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  itemSku: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  itemQty: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  orderSummary: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.secondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.primary,
  },
  discountLabel: {
    fontSize: 14,
    color: colors.success,
  },
  discountValue: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.secondary,
    flex: 1,
  },
});
