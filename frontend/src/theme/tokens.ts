/**
 * SPP Design System — Dark Luxury tokens.
 * Everything premium in this app must consume from here.
 */

export const colors = {
  // Surfaces
  bg: '#060B14',             // deep navy — base
  bgElevated: '#0B1220',
  surface: '#111827',
  surfaceHi: '#1F2937',
  surfaceGlass: 'rgba(6, 11, 20, 0.62)',
  surfaceGlassStrong: 'rgba(6, 11, 20, 0.78)',

  // Ink
  text: '#F8FAFC',
  textDim: '#CBD5E1',
  textMuted: '#94A3B8',
  textSubtle: '#64748B',

  // Brand — gold primary + emerald secondary (per design spec)
  gold: '#D4AF37',
  goldSoft: 'rgba(212, 175, 55, 0.14)',
  goldEdge: 'rgba(212, 175, 55, 0.35)',
  emerald: '#50C878',
  emeraldSoft: 'rgba(80, 200, 120, 0.14)',
  emeraldEdge: 'rgba(80, 200, 120, 0.35)',
  emeraldGlow: 'rgba(80, 200, 120, 0.45)',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Structure
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  borderGold: 'rgba(212, 175, 55, 0.28)',
  divider: 'rgba(255, 255, 255, 0.05)',

  // Gradient stops used across the app
  heroTop: '#0A1524',
  heroMid: '#060B14',
  auroraA: 'rgba(80, 200, 120, 0.16)',
  auroraB: 'rgba(212, 175, 55, 0.10)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 10,
  md: 18,
  lg: 26,
  xl: 34,
  pill: 999,
} as const;

export const typography = {
  // Strict scale from design spec.
  display: 32,
  largeTitle: 28,
  title: 22,
  cardTitle: 18,
  body: 15,
  small: 13,
  micro: 11,

  // Number scale (only when necessary)
  numLg: 36,
  numMd: 28,
  numSm: 22,

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  letter: {
    tight: -0.6,
    normal: -0.2,
    loose: 0.4,
  },
};

export const shadows = {
  glass: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  glow: {
    shadowColor: colors.emerald,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

export const motion = {
  fast: 180,
  base: 320,
  slow: 520,
  breath: 2600, // for pulsing orbs
};

export const theme = { colors, spacing, radius, typography, shadows, motion };
export default theme;
