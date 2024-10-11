import React from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";

import { IPresets, presets } from "./Text.presets";
import { ITextProps } from "./Text.props";
import {
  textFontWeightStyles,
  textRtlStyle,
  textSizeStyles,
} from "./Text.styles";
import { translate } from "../../i18n";
import { useAppTheme } from "../../theme/useAppTheme";

/**
 * For your text displaying needs.
 * This component is a HOC over the built-in React Native one.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/components/Text/}
 * @param {ITextProps} props - The props for the `Text` component.
 * @returns {JSX.Element} The rendered `Text` component.
 */
export const Text = React.forwardRef<RNText, ITextProps>((props, ref) => {
  const {
    weight,
    size,
    tx,
    txOptions,
    text,
    children,
    style: styleProp,
    ...rest
  } = props;

  const { themed } = useAppTheme();

  const i18nText = tx && translate(tx, txOptions);
  const content = i18nText || text || children;

  const preset: IPresets = props.preset ?? "default";

  const styles: StyleProp<TextStyle> = [
    textRtlStyle,
    themed(presets[preset]),
    weight && textFontWeightStyles[weight],
    size && textSizeStyles[size],
    styleProp,
  ];

  return (
    <RNText ref={ref} {...rest} style={styles}>
      {content}
    </RNText>
  );
});

Text.displayName = "Text";
