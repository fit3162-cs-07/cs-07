import type { Config } from 'tailwindcss';

const palette = {
  // Monash institutional blue
  primary: '#006CAB',
  'primary-hover': '#005A8F',
  'primary-pressed': '#004875',
  'primary-subtle': '#E6F2F8',

  // Surfaces
  surface: '#FFFFFF',
  'surface-elevated': '#FFFFFF',
  'surface-muted': '#F8FAFC',

  // Borders (slate scale)
  'border-default': '#E2E8F0',
  'border-strong': '#CBD5E1',
  'border-focus': '#006CAB',

  // Text (slate scale)
  'text-primary': '#0F172A',
  'text-secondary': '#475569',
  'text-tertiary': '#94A3B8',
  'text-on-primary': '#FFFFFF',

  // Semantic
  success: '#059669',
  'success-subtle': '#D1FAE5',
  warning: '#D97706',
  'warning-subtle': '#FEF3C7',
  danger: '#DC2626',
  'danger-subtle': '#FEE2E2',

  // Backwards-compat aliases (removed once Tasks 2-3 migrate consumers).
  ink: '#0F172A',
  muted: '#475569',
  page: '#F8FAFC',
  border: '#E2E8F0',
  'primary-soft': '#E6F2F8',
  accent: '#006CAB',
  error: '#DC2626',
} as const;

const spacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '6': '24px',
  '8': '32px',
  '12': '48px',
  '16': '64px',
} as const;

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#FFFFFF',
      ...palette,
    },
    spacing,
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
      sm: ['13px', { lineHeight: '18px' }],
      base: ['14px', { lineHeight: '20px' }],
      md: ['14px', { lineHeight: '20px' }],
      lg: ['16px', { lineHeight: '24px' }],
      xl: ['16px', { lineHeight: '24px' }],
      h3: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
      h2: ['20px', { lineHeight: '28px', letterSpacing: '0' }],
      h1: ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
      display: ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
      '2xl': ['20px', { lineHeight: '28px' }],
      '3xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
    },
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '6px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
      // Cards: hover-only lift
      sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
      // Modals only
      md: '0 4px 6px -1px rgba(15, 23, 42, 0.08)',
      // Dropdowns and popovers only
      lg: '0 10px 15px -3px rgba(15, 23, 42, 0.10)',
      DEFAULT: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
      focus: '0 0 0 2px rgba(0, 108, 171, 0.35)',
    },
    extend: {
      ringColor: {
        DEFAULT: palette['border-focus'],
      },
      ringOffsetColor: {
        DEFAULT: palette.surface,
      },
      transitionDuration: {
        DEFAULT: '120ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
