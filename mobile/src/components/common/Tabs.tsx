import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../../lib/theme';

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  activeId,
  onChange,
  scrollable = true,
  variant = 'underline',
}: {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  scrollable?: boolean;
  /** underline: bordered tab row (ShopByCategory/Footwear). weight: bold color-contrast only (LatestArrivals). */
  variant?: 'underline' | 'weight';
}) {
  const content = (
    <View style={[styles.row, variant === 'underline' && styles.rowUnderline]}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.tab,
              variant === 'underline' && styles.tabUnderline,
              variant === 'underline' && active && styles.tabUnderlineActive,
            ]}
          >
            <Text
              style={[
                variant === 'underline' ? styles.labelUnderline : styles.labelWeight,
                active ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!scrollable) return content;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  rowUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabUnderlineActive: {
    borderBottomColor: colors.primary,
  },
  labelUnderline: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelWeight: {
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  labelActive: {
    color: colors.primary,
  },
  labelInactive: {
    color: colors.placeholder,
  },
});
