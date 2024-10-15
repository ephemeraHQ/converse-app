import { useAppTheme } from "@theme/useAppTheme";
import { StyleProp, TextStyle } from "react-native";

import { IPresets, textPresets } from "./Text.presets";
import { ITextStyleProps } from "./Text.props";
import { textFontWeightStyles, textSizeStyles } from "./Text.styles";

export const getTextStyle = (
  themed: ReturnType<typeof useAppTheme>["themed"],
  { weight, size, style: styleProp, ...props }: ITextStyleProps
): StyleProp<TextStyle> => {
  const preset: IPresets = props.preset ?? "body";
  const $styles: StyleProp<TextStyle> = [
    themed(textPresets[preset]),
    weight && textFontWeightStyles[weight],
    size && textSizeStyles[size],
    styleProp,
  ];

  return $styles;
};
