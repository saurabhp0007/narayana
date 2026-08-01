import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '../../lib/theme';
import { useConfirmStore } from '../../store/confirmStore';

export function ConfirmDialogHost() {
  const { isOpen, options, handle } = useConfirmStore();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(isOpen ? 1 : 0, { stiffness: 300, damping: 26 });
  }, [isOpen]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  if (!options) return null;

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={() => handle(false)}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => handle(false)} />
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.title}>{options.title}</Text>
          {options.description ? <Text style={styles.description}>{options.description}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => handle(false)}>
              <Text style={styles.cancelText}>{options.cancelLabel ?? 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, options.danger ? styles.dangerButton : styles.confirmButton]}
              onPress={() => handle(true)}
            >
              <Text style={styles.confirmText}>{options.confirmLabel ?? 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightBackground,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  cancelText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  confirmText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
