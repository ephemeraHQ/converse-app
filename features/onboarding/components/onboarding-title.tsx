import { AnimatedText, IAnimatedTextProps } from "@/design-system/Text";
import { memo } from "react";
import { TextStyle } from "react-native";

const $defaultStyle: TextStyle = {
  textAlign: "center",
};

export const OnboardingTitle = memo(function OnboardingTitle(
  props: IAnimatedTextProps
) {
  const { style, ...rest } = props;
  return (
    <AnimatedText
      weight="semiBold"
      size="xxl"
      style={[$defaultStyle, style]}
      {...rest}
    />
  );
});
