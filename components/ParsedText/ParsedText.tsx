import React, { forwardRef, memo, useMemo } from "react";
import { TextProps as RNTextProps, StyleSheet } from "react-native";
import RNParsedText, {
  ParsedTextProps,
  ParseShape,
} from "react-native-parsed-text";

type IParsedTextProps = ParsedTextProps & {
  parse: NonNullable<ParsedTextProps["parse"]>;
  pressableStyle?: RNTextProps["style"];
};

export const ParsedText = memo(
  forwardRef<RNParsedText, IParsedTextProps>((props, ref) => {
    const { parse, style, pressableStyle, ...rest } = props;

    const parseOptions: ParseShape[] = useMemo(
      (): ParseShape[] =>
        parse.map(({ onPress, ...rest }) => ({
          ...rest,
          onPress,
          style: StyleSheet.flatten([style, pressableStyle]),
        })),
      [parse, style, pressableStyle]
    );

    return (
      <RNParsedText style={style} parse={parseOptions} ref={ref} {...rest} />
    );
  })
);
