import { IThemed } from "@theme/useAppTheme";
import { StyleProp, TextStyle } from "react-native";

import { IPresets, presets } from "./Text.presets";
import { ITextStyleProps } from "./Text.props";
import {
  textFontWeightStyles,
  textRtlStyle,
  textSizeStyles,
} from "./Text.styles";

export const getTextStyle = (
  themed: IThemed,
  { weight, size, style: styleProp, ...props }: ITextStyleProps
): StyleProp<TextStyle> => {
  const preset: IPresets = props.preset ?? "default";
  const $styles: StyleProp<TextStyle> = [
    textRtlStyle,
    themed(presets[preset]),
    weight && textFontWeightStyles[weight],
    size && textSizeStyles[size],
    styleProp,
  ];

  return $styles;
};
