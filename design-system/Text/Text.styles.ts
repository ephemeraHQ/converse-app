import { TextStyle } from "react-native";

import { IWeights } from "./Text.props";
import { typography } from "../../theme";
import { ThemedStyle } from "../../theme/useAppTheme";

export const $textSizeStyles = {
  md: { fontSize: 20, lineHeight: 20 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 20 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 18 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 14 } satisfies TextStyle,
};

const numericWeights: Record<IWeights, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
};

export const $textFontWeightStyles = Object.entries(typography.primary).reduce(
  (acc, [weight, fontFamily]) => {
    return {
      ...acc,
      [weight]: { fontFamily, fontWeight: numericWeights[weight as IWeights] },
    };
  },
  {}
) as Record<IWeights, TextStyle>;

export const textBaseStyle: ThemedStyle<TextStyle> = (theme) => ({
  ...$textSizeStyles.sm,
  ...$textFontWeightStyles.normal,
  color: theme.colors.text.primary,
});
