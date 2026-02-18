/**
 * Ember – theme.ts
 * Single source of truth for all design tokens, types, and shared interfaces.
 */

import { ViewStyle, TextStyle } from 'react-native';

// ─── Colors ──────────────────────────────────────────────────────────────────
export const COLORS = {
  bg:        '#120E0A',
  bgDeep:    '#0C0A0E',
  bgPurple:  '#1A1525',
  surface:   '#1E1812',
  surface2:  '#2A2018',
  border:    'rgba(255,255,255,0.06)',

  orange:    '#FF6B1A',
  amber:     '#FFAA33',
  gold:      '#FFD166',
  cream:     '#FFF4E6',
  muted:     '#7A6555',
  faint:     '#3D2E22',
  red:       '#E84545',
  redDark:   '#8B1A1A',
  blue:      '#4488CC',

  glowOrange: 'rgba(255,107,26,0.25)',
  glowAmber:  'rgba(255,170,51,0.20)',
  glowGold:   'rgba(255,209,102,0.18)',
  glowRed:    'rgba(232,69,69,0.20)',
} as const;

// ─── Fonts ───────────────────────────────────────────────────────────────────
export const FONTS = {
  black:   'Nunito_800ExtraBold',
  bold:    'Nunito_700Bold',
  regular: 'Nunito_400Regular',
  mono:    'SpaceMono_400Regular',
  monoBold:'SpaceMono_700Bold',
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
} as const;

// ─── Radii ───────────────────────────────────────────────────────────────────
export const RADII = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  pill: 50,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const SHADOWS = {
  orange: {
    shadowColor:   COLORS.orange,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius:  20,
    elevation:     12,
  } as ViewStyle,
  amber: {
    shadowColor:   COLORS.amber,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  14,
    elevation:     8,
  } as ViewStyle,
  red: {
    shadowColor:   COLORS.red,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius:  14,
    elevation:     8,
  } as ViewStyle,
  soft: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  12,
    elevation:     6,
  } as ViewStyle,
} as const;

// ─── Gradients ───────────────────────────────────────────────────────────────
export const GRADIENTS = {
  bgDeep:   ['#0C0A0E', '#120E0A', '#1A1410'] as const,
  cta:      ['#FF7A2A', '#FF4500'] as const,
  progress: ['#FF6B1A', '#FFD166'] as const,
  gold:     ['#FFCC44', '#FF8C00'] as const,
  danger:   ['#8B1A1A', '#E84545'] as const,
} as const;

// ─── Animation Durations ─────────────────────────────────────────────────────
export const DURATION = {
  fast:   150,
  normal: 280,
  slow:   450,
  pulse:  1800,
  float:  2800,
} as const;

// ─── Mascot State Enum ───────────────────────────────────────────────────────
export type MascotState =
  | 'idle'
  | 'focused'
  | 'excited'
  | 'sad'
  | 'tired'
  | 'celebrating';

// ─── Shared Navigation Type ──────────────────────────────────────────────────
export interface NavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  goBack:   () => void;
}

// ─── Typography helpers ──────────────────────────────────────────────────────
export const TYPE = {
  display: { fontFamily: FONTS.black,   fontSize: 42, letterSpacing: -1   } as TextStyle,
  h1:      { fontFamily: FONTS.black,   fontSize: 28, letterSpacing: -0.5 } as TextStyle,
  h2:      { fontFamily: FONTS.bold,    fontSize: 22, letterSpacing: -0.3 } as TextStyle,
  h3:      { fontFamily: FONTS.bold,    fontSize: 18                      } as TextStyle,
  body:    { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22      } as TextStyle,
  small:   { fontFamily: FONTS.regular, fontSize: 13                      } as TextStyle,
  caption: { fontFamily: FONTS.regular, fontSize: 11, letterSpacing: 0.4  } as TextStyle,
  mono:    { fontFamily: FONTS.mono,    fontSize: 12, letterSpacing: 0.5  } as TextStyle,
  monoLg:  { fontFamily: FONTS.mono,    fontSize: 32, letterSpacing: 2    } as TextStyle,
} as const;
