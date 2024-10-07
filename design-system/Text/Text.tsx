import React from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";

import { $presets } from "./Text.presets";
import { IPresets, ITextProps } from "./Text.props";
import { $fontWeightStyles, $rtlStyle, $sizeStyles } from "./Text.styles";
import { translate } from "../../i18n";

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
    style: $styleOverride,
    ...rest
  } = props;

  const i18nText = tx && translate(tx, txOptions);
  const content = i18nText || text || children;

  const preset: IPresets = props.preset ?? "default";

  const $styles: StyleProp<TextStyle> = [
    $rtlStyle,
    $presets[preset],
    weight && $fontWeightStyles[weight],
    size && $sizeStyles[size],
    $styleOverride,
  ];

  return (
    <RNText ref={ref} {...rest} style={$styles}>
      {content}
    </RNText>
  );
});

Text.displayName = "Text";
