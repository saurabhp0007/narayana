import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { colors, radius, spacing } from '../../lib/theme';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { navigationRef } from '../../navigation/navigationRef';

interface TabDef {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDef[] = [
  { route: 'Home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { route: 'Products', label: 'Shop', icon: 'grid-outline', iconActive: 'grid' },
  { route: 'Cart', label: 'Cart', icon: 'cart-outline', iconActive: 'cart' },
  { route: 'Wishlist', label: 'Wishlist', icon: 'heart-outline', iconActive: 'heart' },
  { route: 'Profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

/**
 * Rendered once at the root, as a persistent sibling to the app's single flat
 * Stack.Navigator (see RootStack.tsx), so it stays visible on every screen —
 * not just the 5 screens it links to. It reads/drives navigation purely
 * through the global `navigationRef` rather than a navigation prop, since it
 * isn't one of the Stack.Navigator's own screens and so doesn't sit inside
 * that navigator's React context.
 */
export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.count);
  const wishlistCount = useWishlistStore((s) => s.count);
  const [activeRoute, setActiveRoute] = useState<string | undefined>(
    navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined
  );

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      setActiveRoute(navigationRef.getCurrentRoute()?.name);
    });
    return unsubscribe;
  }, []);

  const go = (route: string) => {
    if (!navigationRef.isReady()) return;
    if (activeRoute === route) return;
    navigationRef.dispatch(CommonActions.navigate({ name: route }));
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TABS.map((tab) => {
        const active = activeRoute === tab.route;
        return (
          <TouchableOpacity key={tab.route} style={styles.tabButton} onPress={() => go(tab.route)} activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <Ionicons name={active ? tab.iconActive : tab.icon} size={23} color={active ? colors.primary : colors.secondary} />
              {tab.route === 'Cart' ? <TabBadge count={cartCount} /> : null}
              {tab.route === 'Wishlist' ? <TabBadge count={wishlistCount} /> : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    position: 'relative',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.secondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
