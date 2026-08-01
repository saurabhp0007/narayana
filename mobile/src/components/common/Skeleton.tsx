import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { colors, radius, spacing } from '../../lib/theme';

const { width } = Dimensions.get('window');

export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.base, style, animatedStyle]} />;
}

export function ProductGridSkeleton({ count = 8, columns = 2 }: { count?: number; columns?: number }) {
  const cardWidth = (width - spacing.md * 2 - spacing.md * (columns - 1)) / columns;
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: cardWidth, marginBottom: spacing.md }}>
          <Skeleton style={{ width: cardWidth, height: cardWidth * 1.25, borderRadius: radius.lg }} />
          <Skeleton style={{ width: '80%', height: 12, marginTop: 8, borderRadius: radius.sm }} />
          <Skeleton style={{ width: '50%', height: 12, marginTop: 6, borderRadius: radius.sm }} />
        </View>
      ))}
    </View>
  );
}

export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton style={{ width: 64, height: 80, borderRadius: radius.md }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ width: '70%', height: 14, borderRadius: radius.sm }} />
            <Skeleton style={{ width: '40%', height: 12, borderRadius: radius.sm }} />
            <Skeleton style={{ width: '30%', height: 12, borderRadius: radius.sm }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.lightBackground,
    borderRadius: radius.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
