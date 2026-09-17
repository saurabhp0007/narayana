import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../lib/api';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';

type FieldName = 'name' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'pincode' | 'notes';

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

export const CheckoutScreen = ({ navigation }: any) => {
  const { items, summary, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || '',
      email: prev.email || user?.email || '',
      phone: prev.phone || user?.phone || '',
    }));
  }, [user]);

  const setField = (field: FieldName, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    if (!form.name || !form.email || !form.phone) {
      setError('Please fill in all customer information fields.');
      return false;
    }
    if (!form.address || !form.city || !form.state || !form.pincode) {
      setError('Please fill in all shipping address fields.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const shippingAddress = `${form.address}, ${form.city}, ${form.state}, ${form.pincode}`;
      const response = await orderApi.create({
        shippingAddress,
        contactEmail: form.email,
        contactPhone: form.phone,
        notes: form.notes || undefined,
      });
      await clearCart();
      navigation.replace('OrderConfirmation', { orderId: response.data.orderId });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (opts: {
    field: FieldName;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
    autoCapitalize?: 'none' | 'words';
    multiline?: boolean;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{opts.label}</Text>
      <View
        style={[
          styles.inputContainer,
          opts.multiline && styles.inputContainerMultiline,
          focusedField === opts.field && styles.inputContainerFocused,
        ]}
      >
        <Ionicons name={opts.icon} size={19} color={colors.secondary} style={opts.multiline ? styles.multilineIcon : undefined} />
        <TextInput
          style={[styles.input, opts.multiline && styles.inputMultiline]}
          placeholder={opts.placeholder}
          placeholderTextColor={colors.placeholder}
          value={opts.value}
          onChangeText={(v) => setField(opts.field, v)}
          keyboardType={opts.keyboardType}
          autoCapitalize={opts.autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          multiline={opts.multiline}
          numberOfLines={opts.multiline ? 3 : 1}
          onFocus={() => setFocusedField(opts.field)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Checkout" />
        <EmptyState
          icon="bag-outline"
          title="Your cart is empty"
          description="Add some products before checkout."
          ctaLabel="Browse Products"
          onPressCta={() => navigation.navigate('Products')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Checkout" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.formCard}>
            {renderField({
              field: 'name',
              label: 'Full Name *',
              icon: 'person-outline',
              value: form.name,
              placeholder: 'Enter your full name',
              autoCapitalize: 'words',
            })}
            {renderField({
              field: 'email',
              label: 'Email Address *',
              icon: 'mail-outline',
              value: form.email,
              placeholder: 'you@example.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}
            {renderField({
              field: 'phone',
              label: 'Phone Number *',
              icon: 'call-outline',
              value: form.phone,
              placeholder: '10-digit number',
              keyboardType: 'phone-pad',
            })}
          </View>

          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.formCard}>
            {renderField({
              field: 'address',
              label: 'Street Address *',
              icon: 'location-outline',
              value: form.address,
              placeholder: 'House no., street, area',
            })}
            {renderField({
              field: 'city',
              label: 'City *',
              icon: 'business-outline',
              value: form.city,
              placeholder: 'City',
            })}
            {renderField({
              field: 'state',
              label: 'State *',
              icon: 'map-outline',
              value: form.state,
              placeholder: 'State',
            })}
            {renderField({
              field: 'pincode',
              label: 'PIN Code *',
              icon: 'navigate-outline',
              value: form.pincode,
              placeholder: '6-digit PIN code',
              keyboardType: 'number-pad',
            })}
          </View>

          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.formCard}>
            {renderField({
              field: 'notes',
              label: 'Notes (optional)',
              icon: 'document-text-outline',
              value: form.notes,
              placeholder: 'Special instructions for your order',
              multiline: true,
            })}
          </View>

          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.formCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({summary.itemCount || items.length} items)</Text>
              <Text style={styles.summaryValue}>₹{summary.subtotal.toFixed(2)}</Text>
            </View>
            {summary.totalDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.discountLabel}>Total Discount</Text>
                <Text style={styles.discountValue}>-₹{summary.totalDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>Free</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{summary.total.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.codNote}>Cash on Delivery — pay when your order arrives.</Text>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Place Order</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1, backgroundColor: colors.lightBackground },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: 8,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 13 },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputContainerMultiline: { alignItems: 'flex-start' },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  multilineIcon: { marginTop: 2 },
  input: { flex: 1, fontSize: 15, color: colors.primary, padding: 0 },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: colors.secondary },
  summaryValue: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  discountLabel: { fontSize: 14, color: colors.success },
  discountValue: { fontSize: 14, color: colors.success, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 8, marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.primary },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  codNote: { fontSize: 12, color: colors.secondary, textAlign: 'center', marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
