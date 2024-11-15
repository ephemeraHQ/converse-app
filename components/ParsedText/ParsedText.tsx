import { ITextProps, Text } from "@design-system/Text";
import React, { ReactNode, forwardRef } from "react";
import { Text as RNText } from "react-native";
import { ICustomParseShape } from "./ParsedText.types";
import { PATTERNS, isDefaultPattern, parseText } from "./ParsedText.utils";

export type ParsedTextProps = {
  /** The text or components to render */
  children: ReactNode;
  /** Array of patterns to parse the text */
  parse: ICustomParseShape[];
  /** Props to be passed to each child Text component */
  childrenProps?: ITextProps;
} & ITextProps;

export const ParsedText = forwardRef<RNText, ParsedTextProps>((props, ref) => {
  const { parse, childrenProps = {}, ...rest } = props;

  /**
   * Converts parse patterns to include the actual regex patterns.
   * If a known type is provided, it replaces it with the corresponding regex.
   */
  const getPatterns = (): ICustomParseShape[] => {
    return (
      parse.map((option) => {
        if (isDefaultPattern(option)) {
          const { type, ...patternOption } = option;
          if (!PATTERNS[type]) {
            throw new Error(`${type} is not a supported type`);
          }
          return {
            ...patternOption,
            pattern: PATTERNS[type],
          } as ICustomParseShape;
        }

        return option;
      }) || []
    );
  };

  /**
   * Parses the text and generates Text components with the matched patterns.
   */
  const getParsedText = (): ReactNode => {
    if (!parse) {
      return props.children;
    }
    if (typeof props.children !== "string") {
      return props.children;
    }

    const patterns = getPatterns();
    const parsedParts = parseText({ text: props.children, patterns });

    return parsedParts.map((parsedProps, index) => {
      const { style: parentStyle } = props;
      const { style, children, _matched, ...remainderParsed } = parsedProps;

      return (
        <Text
          key={`parsedText-${index}`}
          style={[parentStyle, style]}
          {...childrenProps}
          {...(remainderParsed as ITextProps)}
        >
          {children}
        </Text>
      );
    });
  };

  return (
    <Text ref={ref} {...rest}>
      {getParsedText()}
    </Text>
  );
});
