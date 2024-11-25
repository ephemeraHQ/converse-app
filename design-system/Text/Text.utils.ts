import { IThemed } from "@theme/useAppTheme";
import { StyleProp, TextStyle } from "react-native";
import { textPresets } from "./Text.presets";
import {
  IInvertedTextColors,
  ITextColors,
  ITextStyleProps,
} from "./Text.props";
import {
  invertedTextColorStyle,
  textColorStyle,
  textFontWeightStyles,
  textSizeStyles,
} from "./Text.styles";

export const getTextStyle = (
  themed: IThemed,
  {
    weight,
    size,
    color,
    style,
    inverted,
    preset = "body",
    ...props
  }: ITextStyleProps
): StyleProp<TextStyle> => {
  const $styles: StyleProp<TextStyle> = [
    themed(textPresets[preset]),
    inverted &&
      themed((theme) => ({ color: theme.colors.text.inverted.primary })),
    weight && textFontWeightStyles[weight],
    size && textSizeStyles[size],
    color &&
      themed((theme) => {
        if (inverted) {
          return invertedTextColorStyle(theme, color as IInvertedTextColors);
        }
        return textColorStyle(theme, color as ITextColors);
      }),
    style,
  ];

  return $styles;
};
