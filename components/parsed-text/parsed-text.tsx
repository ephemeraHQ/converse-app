import { ITextProps, Text } from "@design-system/Text"
import React, { forwardRef, ReactNode } from "react"
import { Text as RNText } from "react-native"
import { ICustomParseShape } from "./parsed-text.types"
import { isDefaultPattern, parseText, PATTERNS } from "./parsed-text.utils"

export type ParsedTextProps = {
  /** The text or components to render */
  children: ReactNode
  /** Array of patterns to parse the text */
  parse: ICustomParseShape[]
  /** Props to be passed to each child Text component */
  childrenProps?: ITextProps
} & ITextProps

export const ParsedText = forwardRef<RNText, ParsedTextProps>((props, ref) => {
  const { parse, childrenProps = {}, ...rest } = props

  /**
   * Converts parse patterns to include the actual regex patterns.
   * If a known type is provided, it replaces it with the corresponding regex.
   */
  const getPatterns = (): ICustomParseShape[] => {
    return (
      parse.map((option) => {
        if (isDefaultPattern(option)) {
          const { type, ...patternOption } = option
          if (!PATTERNS[type]) {
            throw new Error(`${type} is not a supported type`)
          }
          return {
            ...patternOption,
            pattern: PATTERNS[type],
          } as ICustomParseShape
        }

        return option
      }) || []
    )
  }

  /**
   * Parses the text and generates Text components with the matched patterns.
   */
  const getParsedText = (): ReactNode => {
    if (!parse) {
      return props.children
    }

    // From the patch in case we need it
    //     let stringChild = null;
    // +    let prefix = null;
    // +    let suffix = null;
    // +    if (typeof this.props.children === 'string') {
    // +      stringChild = this.props.children;
    // +    } else if (Array.isArray(this.props.children)) {
    // +      if (typeof this.props.children[0] === "string") {
    // +        stringChild = this.props.children[0];
    // +        suffix = this.props.children.slice(1);
    // +      } else if (typeof this.props.children[this.props.children.length - 1] === "string") {
    // +        stringChild = this.props.children[this.props.children.length - 1];
    // +        prefix = this.props.children.slice(0, this.props.children.length - 1);
    // +      }
    // +    }

    if (typeof props.children !== "string") {
      return props.children
    }

    const patterns = getPatterns()
    const parsedParts = parseText({ text: props.children, patterns })

    // From the patch in case we need it
    //     return [prefix, ...textExtraction.parse().map((props, index) => {
    //       const { style: parentStyle } = this.props;
    //       const { style, ...remainder } = props;
    //       return (
    // @@ -118,7 +132,7 @@ class ParsedText extends React.Component {
    //           {...remainder}
    //         />
    //       );
    // -    });
    // +    }), suffix];

    return parsedParts.map((parsedProps, index) => {
      const { style: parentStyle } = props
      const { style, children, _matched, ...remainderParsed } = parsedProps

      return (
        <Text
          key={`parsedText-${index}`}
          style={[parentStyle, style]}
          {...childrenProps}
          {...(remainderParsed as ITextProps)}
        >
          {children}
        </Text>
      )
    })
  }

  return (
    <Text ref={ref} {...rest}>
      {getParsedText()}
    </Text>
  )
})
