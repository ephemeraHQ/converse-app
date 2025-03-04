import { Platform, TextProps as RNTextProps, StyleProp, TextStyle } from "react-native"
import AnimateableText from "react-native-animateable-text"
import Animated, {
  AnimatedProps,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated"
import { useAppTheme } from "@/theme/use-app-theme"
import { Text } from "./Text"
import { ITextProps } from "./Text.props"

// A wrapper component that makes the base Text component compatible with Reanimated
// Useful for animating text properties like color, opacity, or transform
export type IAnimatedTextProps = AnimatedProps<ITextProps>

export const AnimatedText = Animated.createAnimatedComponent(Text)

// A specialized text component that efficiently updates text content using SharedValue

// We omit 'style' from RNTextProps and explicitly redefine it to ensure proper type checking
// with Reanimated's StyleProp<TextStyle>. This prevents type conflicts between React Native's
// default style types and Reanimated's animated style types.
export type IAnimatableTextProps = Omit<RNTextProps, "style"> & {
  text: SharedValue<string>
  // Required to specify text styling - will be merged with theme's default text color
  style: StyleProp<TextStyle>
}

export function AnimatableText({ style, text, ...rest }: IAnimatableTextProps) {
  const { theme } = useAppTheme()

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: TextStyle = {
      color: theme.colors.text.primary,
    }

    // Special handling for Android font weight due to a known issue in react-native-animateable-text
    // where Android requires fontWeight to be a string, while the style type expects a number
    // This workaround ensures consistent font weight behavior across platforms
    if (
      Platform.OS === "android" &&
      style &&
      typeof style === "object" &&
      !Array.isArray(style) &&
      "fontWeight" in style
    ) {
      baseStyle.fontWeight = String(style.fontWeight) as TextStyle["fontWeight"]
    } else if (style && typeof style === "object" && !Array.isArray(style)) {
      Object.assign(baseStyle, style)
    }

    return baseStyle
  })

  const animatedProps = useAnimatedProps(() => ({
    text: text.value,
  }))

  return <AnimateableText animatedProps={animatedProps} style={animatedStyle} {...rest} />
}
