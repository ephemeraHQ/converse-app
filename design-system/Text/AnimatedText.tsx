import { useAppTheme } from "@/theme/useAppTheme";
import { TextProps as RNTextProps } from "react-native";
import AnimateableText from "react-native-animateable-text";
import Animated, {
  AnimatedProps,
  SharedValue,
  useAnimatedProps,
} from "react-native-reanimated";
import { Text } from "./Text";
import { ITextProps } from "./Text.props";

// A wrapper component that makes the base Text component compatible with Reanimated
// Useful for animating text properties like color, opacity, or transform
export type IAnimatedTextProps = AnimatedProps<ITextProps>;

export const AnimatedText = Animated.createAnimatedComponent(Text);

// A specialized text component that efficiently updates text content using SharedValue
// Optimized for frequent text changes without causing re-renders
// Uses react-native-animateable-text under the hood for better performance
export type IAnimatableTextProps = RNTextProps & {
  text: SharedValue<string>;
};

export function AnimatableText({ style, text, ...rest }: IAnimatableTextProps) {
  const { theme } = useAppTheme();

  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value,
    };
  });

  return (
    <AnimateableText
      animatedProps={animatedProps}
      style={[
        {
          color: theme.colors.text.primary,
        },
        style,
      ]}
      {...rest}
    />
  );
}
