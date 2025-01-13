import { AnimatedText, IAnimatedTextProps } from "@/design-system/Text";
import { memo } from "react";

export const OnboardingTitle = memo(function OnboardingTitle(
  props: IAnimatedTextProps
) {
  const { style, ...rest } = props;
  return (
    <AnimatedText
      weight="semiBold"
      size="xxl"
      style={[{ textAlign: "center" }, style]}
      {...rest}
    />
  );
});
