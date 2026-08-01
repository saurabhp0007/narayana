import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, gradients, spacing } from '../../lib/theme';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { SearchOverlay } from './SearchOverlay';

function Badge({ count }: { count: number }) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withSpring(1.25, { stiffness: 400, damping: 8 }, () => {
      scale.value = withSpring(1);
    });
  }, [count]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (count <= 0) return null;
  return (
    <Animated.View style={[styles.badge, style]}>
      <Animated.Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Animated.Text>
    </Animated.View>
  );
}

export function AppHeader({ showBackButton = false }: { showBackButton?: boolean }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.count);
  const wishlistCount = useWishlistStore((s) => s.count);
  const [searchOpen, setSearchOpen] = useState(false);

  const goHome = () => {
    navigation.dispatch(
      CommonActions.navigate({ name: 'Root', params: { screen: 'Home' } })
    );
  };

  return (
    <LinearGradient colors={gradients.chrome} style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <View style={styles.side}>
          {showBackButton ? (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={10}>
              <Ionicons name="menu" size={26} color={colors.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setSearchOpen(true)} hitSlop={10}>
            <Ionicons name="search" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={goHome} style={styles.logoWrap}>
          <Image
            source={require('../../../assets/brand/logo.png')}
            style={[styles.logo, { tintColor: colors.white }]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={[styles.side, styles.sideRight]}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Root', params: { screen: 'Wishlist' } }))}
            hitSlop={10}
            style={styles.iconButton}
          >
            <Ionicons name="heart-outline" size={22} color={colors.white} />
            <Badge count={wishlistCount} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Root', params: { screen: 'Cart' } }))}
            hitSlop={10}
            style={styles.iconButton}
          >
            <Ionicons name="cart-outline" size={22} color={colors.white} />
            <Badge count={cartCount} />
          </TouchableOpacity>
        </View>
      </View>

      <SearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 56,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: 84,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 44,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
