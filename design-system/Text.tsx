import { textSecondaryColor } from "@styles/colors";
import React, { forwardRef, memo } from "react";
import {
  Platform,
  Text as RNText,
  TextProps,
  useColorScheme,
} from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

export type ITextProps = TextProps;

export const Text = memo(
  forwardRef<RNText, ITextProps>(({ children, style, ...props }, ref) => {
    const colorScheme = useColorScheme();

    return (
      <RNText
        ref={ref}
        style={[
          {
            ...Platform.select({
              default: {
                fontSize: 16,
                lineHeight: 20,
                color: textSecondaryColor(colorScheme),
              },
              android: {
                fontSize: 14,
                lineHeight: 20,
                color: textSecondaryColor(colorScheme),
                maxWidth: 260,
              },
            }),
          },
          style,
        ]}
        {...props}
      >
        {children}
      </RNText>
    );
  })
);

export type IAnimatedTextProps = AnimatedProps<ITextProps>;

export const AnimatedText = Animated.createAnimatedComponent(Text);
