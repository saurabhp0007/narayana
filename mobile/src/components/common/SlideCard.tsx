import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { colors, radius, spacing } from '../../lib/theme';

const CROSSFADE_MS = 1200;
const INTERVAL_MS = 4500;

export function SlideCard({
  images,
  title,
  badgeLabel,
  badgeColor = 'rgba(255,255,255,0.85)',
  badgeTextColor = colors.primary,
  onPress,
  style,
}: {
  images: string[];
  title: string;
  badgeLabel?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const [index, setIndex] = useState(() => (images.length > 0 ? Math.floor(Math.random() * images.length) : 0));
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    scale.value = 1;
    scale.value = withTiming(1.08, { duration: INTERVAL_MS, easing: Easing.linear });
  }, [index]);

  useEffect(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      opacity.value = withTiming(0, { duration: CROSSFADE_MS / 2 }, (finished) => {
        if (finished) {
          opacity.value = withTiming(1, { duration: CROSSFADE_MS / 2 });
        }
      });
      setTimeout(() => setIndex((i) => (i + 1) % images.length), CROSSFADE_MS / 2);
    }, INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [images.length]);

  const imageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, style]}>
      <View style={styles.imageWrap}>
        <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
          <Image source={{ uri: images[index] }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Animated.View>
        {badgeLabel ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badgeLabel}</Text>
          </View>
        ) : null}
        {images.length > 1 ? (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {},
  imageWrap: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.lightBackground,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dots: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 10,
    backgroundColor: colors.white,
  },
  title: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
});
