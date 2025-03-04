import { memo } from "react"
import { TouchableHighlight as RNTouchableHighlight, TouchableHighlightProps } from "react-native"
import { useAppTheme } from "@/theme/use-app-theme"

export const TouchableHighlight = memo(function TouchableHighlight(props: TouchableHighlightProps) {
  const { theme } = useAppTheme()
  return <RNTouchableHighlight underlayColor={theme.colors.background.sunken} {...props} />
})
