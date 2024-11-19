import React from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";

import { translate } from "../../i18n";
import { useAppTheme } from "../../theme/useAppTheme";
import { ITextProps } from "./Text.props";
import { getTextStyle } from "./Text.utils";

export const Text = React.forwardRef<RNText, ITextProps>((props, ref) => {
  const {
    weight,
    size,
    color,
    tx,
    txOptions,
    text,
    children,
    style: styleProp,
    preset,
    ...rest
  } = props;

  const { themed } = useAppTheme();

  const i18nText = tx && translate(tx, txOptions);
  const content = i18nText || text || children;

  const styles: StyleProp<TextStyle> = getTextStyle(themed, {
    weight,
    size,
    color,
    style: styleProp,
    preset,
  });

  return (
    <RNText ref={ref} {...rest} style={styles}>
      {content}
    </RNText>
  );
});

Text.displayName = "Text";
