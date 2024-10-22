import { TextStyle } from "react-native";

import { IWeights } from "./Text.props";
import { IColors, typography } from "../../theme";
import { Theme, ThemedStyle } from "../../theme/useAppTheme";

export const textSizeStyles = {
  md: { fontSize: 20, lineHeight: 20 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 20 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 18 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 14 } satisfies TextStyle,
};

export const textColorStyle = (
  theme: Theme,
  color: Exclude<keyof IColors["text"], "inverted">
) => ({ color: theme.colors.text[color] as string });

const numericWeights: Record<IWeights, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
};

export const textFontWeightStyles = Object.entries(typography.primary).reduce(
  (acc, [weight, fontFamily]) => {
    return {
      ...acc,
      [weight]: { fontFamily, fontWeight: numericWeights[weight as IWeights] },
    };
  },
  {}
) as Record<IWeights, TextStyle>;

export const textBaseStyle: ThemedStyle<TextStyle> = (theme) => ({
  ...textSizeStyles.sm,
  ...textFontWeightStyles.normal,
  color: theme.colors.text.primary,
});
