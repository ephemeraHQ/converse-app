import { AnimatedText, IAnimatedTextProps } from "@/design-system/Text";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { memo } from "react";
import { TextStyle } from "react-native";

const $defaultStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginTop: spacing.xxs,
  marginBottom: spacing.lg,
});

export const OnboardingFooterText = memo(function OnboardingFooterText(
  props: IAnimatedTextProps
) {
  const { style, ...rest } = props;
  const { themed } = useAppTheme();
  return (
    <AnimatedText
      preset="small"
      style={[themed($defaultStyle), style]}
      {...rest}
    />
  );
});
