// Mirrors the web frontend's design tokens (frontend/src/app/globals.css, Tailwind v4 @theme block)
// so the two clients render from the same palette/scale.

export const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  900: '#111827',
};

export const accent = {
  50: '#fffbeb',
  100: '#fef3c7',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  900: '#78350f',
};

export const colors = {
  // Primary action color across the app (web's dominant gray-900 convention —
  // chosen as the single canonical primary color over the web's indigo/blue outliers)
  primary: gray[900],
  primaryHover: gray[700],
  secondary: gray[500],
  background: '#ffffff',
  lightBackground: gray[50],
  accent: accent[500],
  danger: '#dc2626',
  dangerHover: '#b91c1c',
  success: '#16a34a',
  warning: accent[500],
  info: '#3b82f6',
  border: gray[300],
  borderLight: gray[200],
  placeholder: gray[400],
  white: '#ffffff',
  black: '#000000',

  // Order status badge colors (bg/text pairs)
  statusPending: { bg: '#fef3c7', text: '#92400e' },
  statusConfirmed: { bg: '#dbeafe', text: '#1e40af' },
  statusShipped: { bg: '#f3e8ff', text: '#6b21a8' },
  statusDelivered: { bg: '#d1fae5', text: '#065f46' },
  statusCancelled: { bg: '#fee2e2', text: '#991b1b' },

  // Product badge chip colors (mirrors frontend/src/lib/productBadge.ts)
  badge: {
    NEW: '#059669',
    SALE: '#dc2626',
    LIMITED_SALE: '#dc2626',
    PREMIUM: gray[900],
    TRENDING: '#9333ea',
    COMBO: '#ea580c',
    BEST_VALUE: '#2563eb',
    CASUAL: gray[600],
    OFFER: accent[600],
    UNDER_1K: '#0d9488',
    BUDGET_PICK: '#334155',
    LUXURY: '#a21caf',
  } as Record<string, string>,
};

export const badgeLabels: Record<string, string> = {
  BEST_VALUE: 'BEST VALUE',
  UNDER_1K: 'UNDER ₹1K',
  BUDGET_PICK: 'BUDGET PICK',
  LIMITED_SALE: 'LIMITED SALE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },
} as const;

// Loaded via expo-font in App.tsx (see lib/fonts.ts); falls back to the
// platform serif until the custom font finishes loading.
export const fontDisplay = 'PlayfairDisplay_700Bold';
export const fontDisplayFallback = 'Georgia';

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.primary },
  h2: { fontSize: 24, fontWeight: '600' as const, color: colors.primary },
  h3: { fontSize: 20, fontWeight: '600' as const, color: colors.primary },
  body: { fontSize: 16, color: colors.primary },
  caption: { fontSize: 14, color: colors.secondary },
  small: { fontSize: 12, color: colors.secondary },
};

// Shared gradient used for the top "chrome" of the app (header + drawer top
// section) so the safe-area-to-content transition looks identical everywhere.
export const gradients = {
  chrome: [colors.primary, colors.primaryHover] as [string, string],
};

// Expo-out cubic-bezier used throughout the web's Framer Motion transitions.
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
