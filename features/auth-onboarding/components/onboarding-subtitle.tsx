import { memo } from "react"
import { TextStyle } from "react-native"
import { AnimatedText, IAnimatedTextProps } from "@/design-system/Text"

const $defaultStyle: TextStyle = {
  textAlign: "center",
}

export const OnboardingSubtitle = memo(function OnboardingSubtitle(props: IAnimatedTextProps) {
  const { style, ...rest } = props
  return <AnimatedText size="sm" style={[$defaultStyle, style]} {...rest} />
})
