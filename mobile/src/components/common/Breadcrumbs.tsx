import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';

export interface Crumb {
  label: string;
  onPress?: () => void;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <View key={i} style={styles.crumbWrap}>
            {item.onPress && !isLast ? (
              <TouchableOpacity onPress={item.onPress}>
                <Text style={styles.link}>{item.label}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.current} numberOfLines={1}>
                {item.label}
              </Text>
            )}
            {!isLast && <Text style={styles.sep}>/</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  crumbWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    fontSize: 13,
    color: colors.info,
  },
  current: {
    fontSize: 13,
    color: colors.secondary,
    maxWidth: 160,
  },
  sep: {
    fontSize: 13,
    color: colors.placeholder,
    marginHorizontal: 6,
  },
});
