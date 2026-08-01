import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { reviewApi } from '../../lib/api';
import { Review } from '../../types';
import { colors, accent, radius, shadow, spacing, fontDisplay } from '../../lib/theme';

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= full ? 'star' : 'star-outline'} size={size} color="#facc15" />
      ))}
    </View>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const progress = useSharedValue(0);
  // Driven as a shared value (not React state) because it's read inside a
  // worklet — plain JS state read via closure isn't guaranteed to be live
  // there, which was causing the transition to flash in the wrong direction
  // before snapping to the correct one ("jitter").
  const direction = useSharedValue(1);

  useEffect(() => {
    reviewApi
      .getHomepage(8)
      .then((res) => setReviews(res.data.data || res.data || []))
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    progress.value = 0;
    progress.value = withSpring(1, { stiffness: 300, damping: 28 });
  }, [index]);

  const cardStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const d = direction.value;
    return {
      opacity: p,
      transform: [
        { perspective: 1000 },
        { translateX: (1 - p) * 120 * d },
        { rotateY: `${(1 - p) * 35 * d}deg` },
        { scale: 0.94 + p * 0.06 },
      ],
    };
  });

  if (isLoading || reviews.length === 0) return null;

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const review = reviews[index % reviews.length];

  const goToPrev = () => {
    direction.value = -1;
    setIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };
  const goToNext = () => {
    direction.value = 1;
    setIndex((prev) => (prev + 1) % reviews.length);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Customer Reviews</Text>
        <Text style={styles.heading}>What Our Customers Say</Text>
        <View style={styles.ratingRow}>
          <StarRating rating={averageRating} />
          <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>Based on {reviews.length}+ reviews</Text>
        </View>
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.quoteMark}>{'“'}</Text>

        <View style={styles.cardHeaderRow}>
          <StarRating rating={review.rating} />
          <Text style={styles.cardRatingValue}>{review.rating.toFixed(1)}</Text>
        </View>

        {review.verifiedPurchase ? (
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          </View>
        ) : null}

        <Text style={styles.reviewText}>"{review.text}"</Text>

        {review.productLabel ? (
          <View style={styles.productChip}>
            <Text style={styles.productChipText}>{review.productLabel}</Text>
          </View>
        ) : null}

        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(review.customerName)}</Text>
          </View>
          <View>
            <Text style={styles.customerName}>{review.customerName}</Text>
            {review.location ? <Text style={styles.customerLocation}>{review.location}</Text> : null}
          </View>
        </View>
      </Animated.View>

      {reviews.length > 1 ? (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.navButton} onPress={goToPrev}>
            <Ionicons name="chevron-back" size={18} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.dots}>
            {reviews.map((r, i) => (
              <TouchableOpacity
                key={r._id}
                onPress={() => {
                  direction.value = i > index ? 1 : -1;
                  setIndex(i);
                }}
              >
                <View style={[styles.dot, i === index && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.navButton} onPress={goToNext}>
            <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: colors.white, paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: colors.placeholder, marginBottom: 6 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  ratingCount: { fontSize: 12, color: colors.secondary },
  card: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.white,
    minHeight: 220,
    ...shadow.sm,
    overflow: 'hidden',
  },
  quoteMark: {
    position: 'absolute',
    top: -8,
    left: 16,
    fontSize: 64,
    color: accent[100],
    fontFamily: fontDisplay,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardRatingValue: { fontSize: 12, color: colors.secondary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  verifiedText: { fontSize: 12, color: colors.success },
  reviewText: { fontSize: 14, color: colors.primaryHover, lineHeight: 20, marginBottom: 12 },
  productChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightBackground,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  productChipText: { fontSize: 11, color: colors.secondary },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  customerName: { fontSize: 14, fontWeight: '600', color: colors.primary },
  customerLocation: { fontSize: 12, color: colors.secondary },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.lg },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
});
