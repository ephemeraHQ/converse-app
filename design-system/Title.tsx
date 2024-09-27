import { textPrimaryColor } from "@styles/colors";
import { memo } from "react";
import { Platform, useColorScheme } from "react-native";

import { AnimatedText, IAnimatedTextProps } from "./Text";

export type ITitleProps = IAnimatedTextProps;

export const Title = memo(({ children, style, ...props }: ITitleProps) => {
  const colorScheme = useColorScheme();

  return (
    <AnimatedText
      style={[
        {
          ...Platform.select({
            default: {
              fontWeight: "600",
              fontSize: 34,
              lineHeight: 40,
              color: textPrimaryColor(colorScheme),
            },
            android: {
              fontSize: 24,
              color: textPrimaryColor(colorScheme),
            },
          }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </AnimatedText>
  );
});
