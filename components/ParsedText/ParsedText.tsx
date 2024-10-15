import { getTextStyle } from "@design-system/Text/Text.utils";
import { useAppTheme } from "@theme/useAppTheme";
import React, { forwardRef, memo, useMemo } from "react";
import RNParsedText from "react-native-parsed-text";

import { IParsedTextProps } from "./ParsedText.props";

const ParsedTextInner = forwardRef<RNParsedText, IParsedTextProps>(
  (props, ref) => {
    const { themed } = useAppTheme();
    const styles = getTextStyle(themed, props);
    const childThemedProps = useMemo(() => {
      return {
        ...props,
        ...props.pressableStyle,
      };
    }, [props]);
    const pressableStyles = getTextStyle(themed, childThemedProps);
    const parseOptions = useMemo(
      () =>
        props.parse.map(({ onPress, ...rest }) => ({
          ...rest,
          onPress,
          style: pressableStyles,
        })),
      [props.parse, pressableStyles]
    );

    return (
      <RNParsedText {...props} parse={parseOptions} ref={ref} style={styles} />
    );
  }
);

export const ParsedText = memo(ParsedTextInner);
