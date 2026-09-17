import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';

export const OrderConfirmationScreen = ({ navigation, route }: any) => {
  const orderId: string | undefined = route.params?.orderId;

  const goToOrders = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Orders' }] });
  };

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={36} color={colors.success} />
      </View>
      <Text style={styles.title}>Order placed successfully</Text>
      {orderId ? <Text style={styles.orderId}>Order ID: {orderId}</Text> : null}
      <Text style={styles.subtitle}>A confirmation email is on its way. You can pay in cash when it arrives.</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={goToOrders} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>View Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={goHome} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  orderId: { fontSize: 14, color: colors.secondary, marginTop: 8 },
  subtitle: { fontSize: 13, color: colors.secondary, textAlign: 'center', marginTop: 6, marginBottom: spacing.xl },
  actions: { width: '100%', gap: spacing.sm },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
