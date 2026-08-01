import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, accent, spacing, EASE_OUT_EXPO } from '../../lib/theme';
import { HeroBanner } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 60;
const EASE_OUT_EXPO_FN = Easing.bezier(EASE_OUT_EXPO[0], EASE_OUT_EXPO[1], EASE_OUT_EXPO[2], EASE_OUT_EXPO[3]);

export function HeroBannerSkeleton() {
  return (
    <View style={[styles.imageArea, styles.skeleton]}>
      <View style={styles.textOverlayPad}>
        <View style={styles.skeletonBar} />
        <View style={[styles.skeletonBar, { width: 200, height: 28, marginTop: 12 }]} />
        <View style={[styles.skeletonBar, { width: 110, height: 36, marginTop: 16 }]} />
      </View>
    </View>
  );
}

function AnnouncementBar({ text }: { text: string }) {
  const [rowWidth, setRowWidth] = useState(0);
  const translateX = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== rowWidth) setRowWidth(w);
  };

  useEffect(() => {
    if (rowWidth === 0) return;
    translateX.value = 0;
    translateX.value = withRepeat(withTiming(-rowWidth / 2, { duration: 22000, easing: Easing.linear }), -1, false);
  }, [rowWidth]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View style={styles.announcementBar}>
      <Animated.View style={[styles.announcementRow, style]} onLayout={onLayout}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Text key={i} style={styles.announcementText}>
            {text} {'  •  '}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

function useKenBurns(activeKey: string) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = 1;
    scale.value = withTiming(1.08, { duration: 5000, easing: Easing.linear });
  }, [activeKey]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

function TextOverlay({ banner, onShopNow }: { banner: HeroBanner; onShopNow: () => void }) {
  const subtitleY = useSharedValue(14);
  const subtitleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const ctaY = useSharedValue(14);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    subtitleY.value = 14;
    subtitleOpacity.value = 0;
    titleY.value = 20;
    titleOpacity.value = 0;
    ctaY.value = 14;
    ctaOpacity.value = 0;

    subtitleY.value = withDelay(150, withTiming(0, { duration: 500, easing: EASE_OUT_EXPO_FN }));
    subtitleOpacity.value = withDelay(150, withTiming(1, { duration: 500, easing: EASE_OUT_EXPO_FN }));
    titleY.value = withDelay(250, withTiming(0, { duration: 550, easing: EASE_OUT_EXPO_FN }));
    titleOpacity.value = withDelay(250, withTiming(1, { duration: 550, easing: EASE_OUT_EXPO_FN }));
    ctaY.value = withDelay(400, withTiming(0, { duration: 500, easing: EASE_OUT_EXPO_FN }));
    ctaOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: EASE_OUT_EXPO_FN }));
  }, [banner._id]);

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <View style={styles.textOverlayPad} pointerEvents="box-none">
      <View style={styles.textMaxWidth}>
        {banner.subtitle ? (
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>{banner.subtitle}</Animated.Text>
        ) : null}
        <Animated.Text style={[styles.title, titleStyle]}>{banner.title}</Animated.Text>
        <Animated.View style={ctaStyle}>
          <TouchableOpacity style={styles.ctaButton} onPress={onShopNow}>
            <Text style={styles.ctaText}>{banner.buttonText || 'Shop Now'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

export function HeroBannerCarousel({
  banners,
  announcementText,
}: {
  banners: HeroBanner[];
  announcementText?: string;
}) {
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeOpacity = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (nextIndex: number) => {
    fadeOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(setActiveIndex)(nextIndex);
        fadeOpacity.value = withTiming(1, { duration: 400 });
      }
    });
  };

  const goToNext = () => goTo((activeIndex + 1) % banners.length);
  const goToPrev = () => goTo((activeIndex - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        fadeOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) fadeOpacity.value = withTiming(1, { duration: 400 });
        });
        return next;
      });
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length]);

  const banner = banners[activeIndex];
  const kenBurnsStyle = useKenBurns(banner?._id ?? '');
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeOpacity.value }));

  const pan = Gesture.Pan()
    .enabled(banners.length > 1)
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) runOnJS(goToNext)();
      else if (e.translationX > SWIPE_THRESHOLD) runOnJS(goToPrev)();
    });

  const goToProducts = (linkUrl?: string) => {
    navigation.dispatch(CommonActions.navigate({ name: 'Root', params: { screen: 'Products' } }));
  };

  return (
    <View style={styles.container}>
      {announcementText ? <AnnouncementBar text={announcementText} /> : null}

      {banners.length === 0 ? null : (
        <GestureDetector gesture={pan}>
          <View style={styles.imageArea}>
            <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
              <Animated.View style={[StyleSheet.absoluteFill, kenBurnsStyle]}>
                <Image
                  source={{ uri: banner.mobileImage || banner.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </Animated.View>

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <TextOverlay banner={banner} onShopNow={() => goToProducts(banner.linkUrl)} />
            </Animated.View>

            {banners.length > 1 ? (
              <>
                <TouchableOpacity style={styles.arrowLeft} onPress={goToPrev} hitSlop={12}>
                  <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowRight} onPress={goToNext} hitSlop={12}>
                  <Ionicons name="chevron-forward" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={styles.dots}>
                  {banners.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goTo(i)}>
                      <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </GestureDetector>
      )}
    </View>
  );
}

const IMAGE_HEIGHT = SCREEN_WIDTH * 1.25;

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: colors.lightBackground },
  imageArea: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: colors.lightBackground,
    overflow: 'hidden',
  },
  skeleton: { opacity: 0.6 },
  skeletonBar: { width: 120, height: 12, backgroundColor: colors.border, borderRadius: 6 },
  textOverlayPad: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  textMaxWidth: { maxWidth: 320 },
  subtitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 34,
    marginBottom: spacing.md,
    fontFamily: 'PlayfairDisplay_700Bold',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ctaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  arrowLeft: { position: 'absolute', left: 6, top: '50%', marginTop: -16 },
  arrowRight: { position: 'absolute', right: 6, top: '50%', marginTop: -16 },
  dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 22, backgroundColor: '#fff' },
  announcementBar: {
    backgroundColor: accent[700],
    paddingVertical: 8,
    overflow: 'hidden',
  },
  announcementRow: {
    flexDirection: 'row',
  },
  announcementText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
