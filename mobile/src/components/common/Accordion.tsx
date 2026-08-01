import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';

interface AccordionContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function Accordion({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <AccordionContext.Provider value={{ openId, setOpenId }}>{children}</AccordionContext.Provider>;
}

export function AccordionItem({
  id,
  title,
  titleColor,
  children,
}: {
  id: string;
  title: string;
  titleColor?: string;
  children: ReactNode;
}) {
  const ctx = useContext(AccordionContext);
  const isOpen = ctx?.openId === id;
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(isOpen ? 90 : 0, { duration: 250 });
  }, [isOpen]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.item}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => ctx?.setOpenId(isOpen ? null : id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>{title}</Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
        </Animated.View>
      </TouchableOpacity>
      {isOpen ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    paddingBottom: spacing.md,
    backgroundColor: colors.lightBackground,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
