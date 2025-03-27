import { memo } from "react"
import { TextStyle } from "react-native"
import { AnimatedText, IAnimatedTextProps } from "@/design-system/Text"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

const $defaultStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginTop: spacing.xxs,
})

export const OnboardingFooterText = memo(function OnboardingFooterText(props: IAnimatedTextProps) {
  const { style, ...rest } = props
  const { themed } = useAppTheme()
  return <AnimatedText preset="small" style={[themed($defaultStyle), style]} {...rest} />
})
