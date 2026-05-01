export const colors = {
  primary: '#006CAB',
  primaryHover: '#005A8F',
  primaryPressed: '#004875',
  primarySubtle: '#E6F2F8',

  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F8FAFC',

  borderDefault: '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderFocus: '#006CAB',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  success: '#059669',
  successSubtle: '#D1FAE5',
  warning: '#D97706',
  warningSubtle: '#FEF3C7',
  danger: '#DC2626',
  dangerSubtle: '#FEE2E2',
} as const;

export const spacing = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const typography = {
  fontFamilySans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamilyMono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
  display: { size: 30, lineHeight: 36, weight: 600, letterSpacing: '-0.02em' },
  heading1: { size: 24, lineHeight: 32, weight: 600, letterSpacing: '-0.01em' },
  heading2: { size: 20, lineHeight: 28, weight: 600, letterSpacing: '0' },
  heading3: { size: 16, lineHeight: 24, weight: 600, letterSpacing: '0' },
  bodyLarge: { size: 16, lineHeight: 24, weight: 400 },
  body: { size: 14, lineHeight: 20, weight: 400 },
  small: { size: 12, lineHeight: 16, weight: 400, letterSpacing: '0.01em' },
} as const;

export const radius = {
  none: 0,
  sm: 4,
  base: 6,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.08)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.10)',
  focus: '0 0 0 2px rgba(0, 108, 171, 0.35)',
} as const;

export const motion = {
  duration: 120,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
