import { ViewStyle } from "react-native";
import { ActivityIndicator } from "@/design-system/activity-indicator";
import { IIconName } from "@/design-system/Icon/Icon.types";
import { AnimatedVStack } from "@/design-system/VStack";
import { OnboardingIconButton } from "@/features/onboarding/components/onboarding-icon-button";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "../onboarding.constants";
import { OnboardingFooterText } from "./onboarding-footer-text";

type IOnboardingFooterProps = {
  text: string;
  iconName: IIconName;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

const $iconButtonStyle: ThemedStyle<ViewStyle> = ({ borderRadius }) => ({
  borderRadius: borderRadius.lg,
});

export function OnboardingFooter({
  text,
  iconName,
  onPress,
  disabled,
  isLoading,
}: IOnboardingFooterProps) {
  const { themed, theme } = useAppTheme();
  const { animation } = theme;

  return (
    <AnimatedVStack
      entering={animation
        .fadeInDownSpring()
        .delay(ONBOARDING_ENTERING_DELAY.THIRD)
        .duration(ONBOARDING_ENTERING_DURATION)}
    >
      <OnboardingIconButton
        action="primary"
        size="xl"
        disabled={disabled || isLoading}
        style={themed($iconButtonStyle)}
        onPress={onPress}
        {...(isLoading
          ? { icon: <ActivityIndicator /> }
          : {
              iconName,
            })}
      />
      <OnboardingFooterText color={disabled ? "inactive" : "primary"}>
        {text}
      </OnboardingFooterText>
    </AnimatedVStack>
  );
}
