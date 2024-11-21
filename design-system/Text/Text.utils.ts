import { IThemed } from "@theme/useAppTheme";
import { StyleProp, TextStyle } from "react-native";

import { IPresets, textPresets } from "./Text.presets";
import { ITextStyleProps } from "./Text.props";
import {
  invertedTextColorStyle,
  textColorStyle,
  textFontWeightStyles,
  textSizeStyles,
} from "./Text.styles";

export const getTextStyle = (
  themed: IThemed,
  { weight, size, color, style: styleProp, inverted, ...props }: ITextStyleProps
): StyleProp<TextStyle> => {
  const preset: IPresets = props.preset ?? "body";

  const $styles: StyleProp<TextStyle> = [
    themed(textPresets[preset]),
    inverted &&
      themed((theme) => ({ color: theme.colors.text.inverted.primary })),
    weight && textFontWeightStyles[weight],
    size && textSizeStyles[size],
    color &&
      themed((theme) => {
        if (inverted) {
          return invertedTextColorStyle(theme, color);
        }
        return textColorStyle(theme, color);
      }),
    styleProp,
  ];

  return $styles;
};
