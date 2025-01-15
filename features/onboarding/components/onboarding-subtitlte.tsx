import { AnimatedText, IAnimatedTextProps } from "@/design-system/Text";
import { memo } from "react";

export const OnboardingSubtitle = memo(function OnboardingSubtitle(
  props: IAnimatedTextProps
) {
  const { style, ...rest } = props;
  return (
    <AnimatedText
      size="sm"
      style={[{ textAlign: "center" }, style]}
      {...rest}
    />
  );
});
