import { typography } from "@theme/typography"
import { TextStyle } from "react-native"
import { Theme, ThemedStyle } from "@/theme/use-app-theme"
import { IInvertedTextColors, ITextColors, IWeights } from "./Text.props"

export const textSizeStyles = {
  ["5xl"]: { fontSize: 80, lineHeight: 88 } satisfies TextStyle,
  ["3xl"]: { fontSize: 48, lineHeight: 60 } satisfies TextStyle,
  xxl: { fontSize: 40, lineHeight: 44 } satisfies TextStyle,
  xl: { fontSize: 32, lineHeight: 36 } satisfies TextStyle, // Made up, need to confirm with Andrew once we have the design
  lg: { fontSize: 24, lineHeight: 28 } satisfies TextStyle, // Made up, need to confirm with Andrew once we have the design
  md: { fontSize: 20, lineHeight: 24 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 20 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 18 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 14 } satisfies TextStyle,
}

const numericWeights: Record<IWeights, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
}

export const textFontWeightStyles = Object.entries(typography.primary).reduce(
  (acc, [weight, fontFamily]) => {
    return {
      ...acc,
      [weight]: { fontFamily, fontWeight: numericWeights[weight as IWeights] },
    }
  },
  {},
) as Record<IWeights, TextStyle>

export const textBaseStyle: ThemedStyle<TextStyle> = (theme) => ({
  ...textSizeStyles.sm,
  ...textFontWeightStyles.normal,
  color: theme.colors.text.primary,
})

export const textColorStyle = (theme: Theme, color: ITextColors) => ({
  color: theme.colors.text[color],
})

export const invertedTextColorStyle = (theme: Theme, color: IInvertedTextColors) => ({
  color: theme.colors.text.inverted[color],
})
