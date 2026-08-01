import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, Easing } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '../../lib/theme';

interface CountdownTimerProps {
  endDate: string;
  label?: string;
}

function getTimeParts(endDate: string) {
  const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: diff === 0 };
}

const CARD_WIDTH = 26;
const CARD_HEIGHT = 38;
const FLIP_MS = 360;

function DigitHalf({
  digit,
  pos,
  style,
}: {
  digit: string;
  pos: 'top' | 'bottom';
  style?: any;
}) {
  return (
    <Animated.View
      style={[
        styles.half,
        pos === 'top' ? styles.halfTop : styles.halfBottom,
        style,
      ]}
    >
      <View style={[styles.halfInner, pos === 'top' ? styles.innerTop : styles.innerBottom]}>
        <Text style={styles.digitText}>{digit}</Text>
      </View>
    </Animated.View>
  );
}

function FlipDigit({ digit }: { digit: string }) {
  const [displayed, setDisplayed] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [animating, setAnimating] = useState(false);
  const displayedRef = useRef(digit);
  const topRotate = useSharedValue(0);
  const bottomRotate = useSharedValue(0);

  useEffect(() => {
    if (digit === displayedRef.current) return;
    setPrevious(displayedRef.current);
    displayedRef.current = digit;
    setDisplayed(digit);
    setAnimating(true);

    topRotate.value = 0;
    bottomRotate.value = 90;
    topRotate.value = withTiming(-90, { duration: FLIP_MS, easing: Easing.in(Easing.ease) });
    bottomRotate.value = withDelay(FLIP_MS, withTiming(0, { duration: FLIP_MS, easing: Easing.out(Easing.ease) }));

    const timeout = setTimeout(() => setAnimating(false), FLIP_MS * 2);
    return () => clearTimeout(timeout);
  }, [digit]);

  const topFlapStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 400 }, { rotateX: `${topRotate.value}deg` }],
  }));
  const bottomFlapStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 400 }, { rotateX: `${bottomRotate.value}deg` }],
  }));

  return (
    <View style={styles.card}>
      <DigitHalf digit={displayed} pos="top" />
      <DigitHalf digit={animating ? previous : displayed} pos="bottom" />
      <View style={styles.seam} />

      {animating ? (
        <>
          <DigitHalf digit={previous} pos="top" style={[styles.flap, { transformOrigin: 'bottom' }, topFlapStyle]} />
          <DigitHalf digit={displayed} pos="bottom" style={[styles.flap, { transformOrigin: 'top' }, bottomFlapStyle]} />
        </>
      ) : null}
    </View>
  );
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const digits = String(value).padStart(2, '0').split('');
  return (
    <View style={styles.unit}>
      <View style={styles.digitRow}>
        {digits.map((d, i) => (
          <FlipDigit key={i} digit={d} />
        ))}
      </View>
      <Text style={styles.unitLabel}>{label}</Text>
    </View>
  );
}

function PulsingDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

export function CountdownTimer({ endDate, label = 'Mega Sale' }: CountdownTimerProps) {
  const [time, setTime] = useState(() => getTimeParts(endDate));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeParts(endDate)), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (time.expired) return null;

  const units = [
    { value: time.days, label: 'DAYS' },
    { value: time.hours, label: 'HOURS' },
    { value: time.minutes, label: 'MINS' },
    { value: time.seconds, label: 'SECS' },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <PulsingDot />
        <Text style={styles.headerLabel}>{label}</Text>
        <Text style={styles.headerSuffix}>Ending In</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.unitsRowContent}
        style={styles.unitsRowScroll}
      >
        <View style={styles.unitsRow}>
          {units.map((unit, i) => (
            <React.Fragment key={unit.label}>
              <FlipUnit value={unit.value} label={unit.label} />
              {i < units.length - 1 ? <Text style={styles.colon}>:</Text> : null}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.lightBackground,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  headerLabel: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  headerSuffix: { fontSize: 13, color: colors.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  unitsRowScroll: { width: '100%', flexGrow: 0 },
  unitsRowContent: { flexGrow: 1, justifyContent: 'center' },
  unitsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  unit: { alignItems: 'center' },
  digitRow: { flexDirection: 'row', gap: 3 },
  unitLabel: { marginTop: 6, fontSize: 9, fontWeight: '700', letterSpacing: 1, color: colors.secondary },
  colon: { fontSize: 16, fontWeight: '300', color: colors.border, marginTop: 10 },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.md,
    ...shadow.sm,
  },
  half: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CARD_HEIGHT / 2,
    overflow: 'hidden',
    alignItems: 'center',
  },
  halfTop: { top: 0, justifyContent: 'flex-start', borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  halfBottom: { bottom: 0, justifyContent: 'flex-end', borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  halfInner: {
    width: '100%',
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerTop: { backgroundColor: colors.white, marginTop: 0 },
  innerBottom: { backgroundColor: colors.lightBackground, marginTop: -CARD_HEIGHT / 2 },
  digitText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  seam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: CARD_HEIGHT / 2 - 0.5,
    height: 1,
    backgroundColor: colors.border,
    zIndex: 30,
  },
  flap: {
    zIndex: 20,
    backfaceVisibility: 'hidden',
  },
});
