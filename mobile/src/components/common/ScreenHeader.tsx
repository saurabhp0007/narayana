import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing } from '../../lib/theme';

/**
 * Generic gradient header used by every non-Home screen (Home uses AppHeader,
 * which shares the same `gradients.chrome` colors) so the safe-area-to-header
 * transition looks identical across the whole app.
 */
export function ScreenHeader({
  title,
  showBack = true,
  onBackPress,
  rightSlot,
}: {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  // Several screens (Cart/Wishlist/Profile/Products) are reachable both as a
  // bottom-tab root (nowhere to go back to) and as a pushed stack screen —
  // hide the arrow automatically instead of needing per-screen logic.
  const shouldShowBack = showBack && navigation.canGoBack();

  return (
    <LinearGradient colors={gradients.chrome} style={{ paddingTop: insets.top }}>
      <View style={styles.row}>
        <View style={styles.side}>
          {shouldShowBack ? (
            <TouchableOpacity onPress={onBackPress ?? (() => navigation.goBack())} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.sidePlaceholder} />
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={[styles.side, styles.sideRight]}>{rightSlot}</View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 52,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 32,
  },
  sidePlaceholder: { width: 22, height: 22 },
  sideRight: { justifyContent: 'flex-end' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
