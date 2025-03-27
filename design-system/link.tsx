import { memo } from "react"
import { TextStyle } from "react-native"
import { ITextProps, Text } from "@/design-system/Text"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

type ILinkProps = ITextProps

export const Link = memo(function Link(props: ILinkProps) {
  const { children, style, ...rest } = props
  const { themed } = useAppTheme()

  return (
    <Text style={[themed($linkStyle), style]} {...rest}>
      {children}
    </Text>
  )
})

const $linkStyle: ThemedStyle<TextStyle> = ({ colors }) => ({
  textDecorationLine: "underline",
})
