import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, EASE_OUT_EXPO } from '../../lib/theme';
import { useToastStore, ToastItem, ToastType } from '../../store/toastStore';

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

const ICON_COLORS: Record<ToastType, string> = {
  success: colors.accent,
  error: colors.danger,
  info: colors.primary,
};

function ToastRow({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(1, { stiffness: 300, damping: 26 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 16 },
      { scale: 0.9 + progress.value * 0.1 },
    ],
  }));

  return (
    <Animated.View style={[styles.toast, style]}>
      <Ionicons name={ICONS[toast.type]} size={20} color={ICON_COLORS[toast.type]} />
      <Text style={styles.message} numberOfLines={3}>
        {toast.message}
      </Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.secondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastHost() {
  const { toasts, dismiss } = useToastStore();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 16 }]}>
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 10000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadow.lg,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
