import { TextStyle } from "react-native";

import { IWeights } from "./Text.props";
import { isRTL } from "../../i18n";
import { typography } from "../../theme";
import { ThemedStyle } from "../../theme/useAppTheme";

export const textSizeStyles = {
  xxl: { fontSize: 36, lineHeight: 44 } satisfies TextStyle,
  xl: { fontSize: 24, lineHeight: 34 } satisfies TextStyle,
  lg: { fontSize: 20, lineHeight: 32 } satisfies TextStyle,
  md: { fontSize: 18, lineHeight: 26 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 21 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 18 } satisfies TextStyle,
};

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
  color: theme.colors.text,
});

export const textRtlStyle: TextStyle = isRTL ? { writingDirection: "rtl" } : {};
