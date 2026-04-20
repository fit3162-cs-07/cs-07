export const colors = {
  primary: '#1E40AF',
  primaryHover: '#1D4ED8',
  primarySoft: '#EFF6FF',
  accent: '#3B82F6',
  surface: '#FFFFFF',
  page: '#F8FAFC',
  ink: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
} as const;

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  body: { size: 14, lineHeight: 21, weight: 400 },
  bodyLarge: { size: 15, lineHeight: 22, weight: 400 },
  heading1: { size: 28, lineHeight: 36, weight: 600 },
  heading2: { size: 24, lineHeight: 32, weight: 600 },
  heading3: { size: 20, lineHeight: 28, weight: 600 },
  caption: { size: 13, lineHeight: 20, weight: 400 },
  badge: { size: 11, lineHeight: 16, weight: 600 },
} as const;

export const radius = {
  none: 0,
  sm: 4,
  base: 6,
  md: 6,
  lg: 8,
  full: 9999,
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.25)',
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
