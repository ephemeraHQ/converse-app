/**
  Use these spacings for margins/paddings and other whitespace throughout your app.
 */
export const spacing = {
  zero: 0,
  "6xs": 0.5,
  "5xs": 1,
  "4xs": 2,
  xxxs: 4,
  xxs: 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  "3xl": 48,
  "4xl": 64,
  "5xl": 80,
  "6xl": 96,
  "7xl": 128,
} as const;

export type ISpacing = typeof spacing;
