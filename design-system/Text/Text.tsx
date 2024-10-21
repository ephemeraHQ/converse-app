import React from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";

import { IPresets, textPresets } from "./Text.presets";
import { ITextProps } from "./Text.props";
import { $textFontWeightStyles, $textSizeStyles } from "./Text.styles";
import { translate } from "../../i18n";
import { useAppTheme } from "../../theme/useAppTheme";

export const Text = React.forwardRef<RNText, ITextProps>((props, ref) => {
  const {
    weight,
    size,
    tx,
    txOptions,
    text,
    children,
    style: $styleOverride,
    ...rest
  } = props;

  const { themed } = useAppTheme();

  const i18nText = tx && translate(tx, txOptions);
  const content = i18nText || text || children;

  const preset: IPresets = props.preset ?? "body";

  const styles: StyleProp<TextStyle> = [
    themed(textPresets[preset]),
    weight && $textFontWeightStyles[weight],
    size && $textSizeStyles[size],
    $styleOverride,
  ];

  return (
    <RNText ref={ref} {...rest} style={styles}>
      {content}
    </RNText>
  );
});

Text.displayName = "Text";
