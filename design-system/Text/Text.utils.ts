import { IThemed } from "@theme/useAppTheme";
import { StyleProp, TextStyle } from "react-native";

import { textPresets } from "./Text.presets";
import { ITextStyleProps } from "./Text.props";
import {
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
    preset = "body",
  }: Pick<ITextStyleProps, "weight" | "size" | "color" | "style" | "preset">
): StyleProp<TextStyle> => {
  const $styles: StyleProp<TextStyle> = [
    themed(textPresets[preset]),
    weight && textFontWeightStyles[weight],
    size && textSizeStyles[size],
    color && themed((theme) => textColorStyle(theme, color)),
    style,
  ];

  return $styles;
};
