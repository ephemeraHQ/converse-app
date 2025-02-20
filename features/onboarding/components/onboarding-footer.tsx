import { IIconName } from "@/design-system/Icon/Icon.types";
import { AnimatedVStack } from "@/design-system/VStack";
import { ActivityIndicator } from "@/design-system/activity-indicator";
import { OnboardingIconButton } from "@/features/onboarding/components/onboarding-icon-button";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { converseEventEmitter } from "@/utils/events";
import { useCallback } from "react";
import { ViewStyle } from "react-native";
import { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "../constants/animation-constants";
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

  const keyboard = useAnimatedKeyboard();

  // AR - don't anticipate this will be here long
  const showDebug = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // When using keyboard avoiding view it is putting this above the keyboard, so we will move it down when the keyboard animates
    return {
      transform: [{ translateY: keyboard.height.value }],
    };
  });

  return (
    <AnimatedVStack
      style={animatedStyle}
      entering={animation
        .fadeInDownSpring()
        .delay(ONBOARDING_ENTERING_DELAY.THIRD)
        .duration(ONBOARDING_ENTERING_DURATION)}
    >
      <OnboardingIconButton
        action="primary"
        size="xl"
        disabled={disabled}
        style={themed($iconButtonStyle)}
        onPress={onPress}
        onLongPress={showDebug}
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
