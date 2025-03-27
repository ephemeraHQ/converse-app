import React from "react"
import { Text as RNText, StyleProp, TextStyle } from "react-native"
import { translate } from "../../i18n"
import { useAppTheme } from "../../theme/use-app-theme"
import { ITextProps } from "./Text.props"
import { getTextStyle } from "./Text.utils"

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
    inverted,
    ...rest
  } = props

  const { themed } = useAppTheme()

  const i18nText = tx && translate(tx, txOptions)
  const content = i18nText || text || children

  const styles: StyleProp<TextStyle> = getTextStyle(themed, {
    weight,
    size,
    color,
    style: styleProp,
    preset,
    inverted,
  })

  return (
    <RNText
      ref={ref}
      style={styles}
      suppressHighlighting={true} // Don't like the default highlight on press
      {...rest}
    >
      {content}
    </RNText>
  )
})

Text.displayName = "Text"
