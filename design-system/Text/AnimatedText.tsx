import { useAppTheme } from "@/theme/useAppTheme";
import {
  TextProps as RNTextProps,
  TextStyle,
  Platform,
  StyleProp,
} from "react-native";
import AnimateableText from "react-native-animateable-text";
import Animated, {
  AnimatedProps,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Text } from "./Text";
import { ITextProps } from "./Text.props";

// A wrapper component that makes the base Text component compatible with Reanimated
// Useful for animating text properties like color, opacity, or transform
export type IAnimatedTextProps = AnimatedProps<ITextProps>;

export const AnimatedText = Animated.createAnimatedComponent(Text);

const AnimatedAnimateableText =
  Animated.createAnimatedComponent(AnimateableText);

// A specialized text component that efficiently updates text content using SharedValue
// Optimized for frequent text changes without causing re-renders
// Uses react-native-animateable-text under the hood for better performance
export type IAnimatableTextProps = Omit<RNTextProps, "style"> & {
  text: SharedValue<string>;
  style?: StyleProp<TextStyle>;
};

export function AnimatableText({ style, text, ...rest }: IAnimatableTextProps) {
  const { theme } = useAppTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: TextStyle = {
      color: theme.colors.text.primary,
    };

    if (
      Platform.OS === "android" &&
      style &&
      typeof style === "object" &&
      !Array.isArray(style) &&
      "fontWeight" in style
    ) {
      baseStyle.fontWeight = String(
        style.fontWeight
      ) as TextStyle["fontWeight"];
    } else if (style && typeof style === "object" && !Array.isArray(style)) {
      Object.assign(baseStyle, style);
    }

    return baseStyle;
  });

  const animatedProps = useAnimatedProps(() => ({
    text: text.value,
  }));

  return (
    <AnimatedAnimateableText
      animatedProps={animatedProps}
      style={animatedStyle}
      {...rest}
    />
  );
}
