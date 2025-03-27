export const iconSize = {
  xxs: 8,
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
} as const

export type IIconSizeKey = keyof typeof iconSize

export type IIconSize = typeof iconSize
