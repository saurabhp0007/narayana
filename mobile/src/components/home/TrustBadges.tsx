import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../lib/theme';

const badges = [
  { label: 'Free Shipping', sublabel: 'On orders above ₹999', icon: 'cube-outline' as const },
  { label: 'Easy Returns', sublabel: 'Within 7 days', icon: 'refresh-outline' as const },
  { label: '100% Secure', sublabel: 'Safe & secure payments', icon: 'lock-closed-outline' as const },
  { label: 'Best Quality', sublabel: 'Premium products', icon: 'checkmark-circle-outline' as const },
];

export function TrustBadges() {
  return (
    <View style={styles.section}>
      <View style={styles.grid}>
        {badges.map((badge) => (
          <View key={badge.label} style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name={badge.icon} size={20} color={colors.primaryHover} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{badge.label}</Text>
              <Text style={styles.sublabel}>{badge.sublabel}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    rowGap: spacing.md,
  },
  row: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.lightBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: colors.primary },
  sublabel: { fontSize: 11, color: colors.secondary, marginTop: 2 },
});
