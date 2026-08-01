import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../lib/theme';

function getPageWindow(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  const window = new Set([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(window)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages.push('ellipsis');
    pages.push(p);
    prev = p;
  }
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = getPageWindow(page, totalPages);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.navButton, page === 1 && styles.disabled]}
        disabled={page === 1}
        onPress={() => onChange(page - 1)}
      >
        <Text style={styles.navText}>Prev</Text>
      </TouchableOpacity>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <Text key={`e${i}`} style={styles.ellipsis}>
            …
          </Text>
        ) : (
          <TouchableOpacity
            key={p}
            style={[styles.pageButton, p === page && styles.pageButtonActive]}
            onPress={() => onChange(p)}
          >
            <Text style={[styles.pageText, p === page && styles.pageTextActive]}>{p}</Text>
          </TouchableOpacity>
        )
      )}

      <TouchableOpacity
        style={[styles.navButton, page === totalPages && styles.disabled]}
        disabled={page === totalPages}
        onPress={() => onChange(page + 1)}
      >
        <Text style={styles.navText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: spacing.lg,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  pageButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonActive: {
    backgroundColor: colors.primary,
  },
  pageText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  pageTextActive: {
    color: colors.white,
  },
  ellipsis: {
    color: colors.placeholder,
    paddingHorizontal: 4,
  },
});
