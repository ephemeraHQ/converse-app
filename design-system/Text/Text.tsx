import React from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";

import { ITextProps } from "./Text.props";
import { getTextStyle } from "./Text.utils";
import { translate } from "../../i18n";
import { useAppTheme } from "../../theme/useAppTheme";

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
    ...props,
  });

  return (
    <RNText ref={ref} {...rest} style={styles}>
      {content}
    </RNText>
  );
});

Text.displayName = "Text";
