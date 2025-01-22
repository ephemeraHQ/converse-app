import { AnimatedVStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { OnboardingIconButton } from "@/features/onboarding/components/onboarding-icon-button";
import { IIconName } from "@/design-system/Icon/Icon.types";
import { OnboardingFooterText } from "./onboarding-footer-text";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "../constants/animation-constants";
import { ViewStyle } from "react-native";
import { useCallback } from "react";
import { converseEventEmitter } from "@/utils/events";
import { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";

type IOnboardingFooterProps = {
  text: string;
  iconName: IIconName;
  onPress: () => void;
  disabled?: boolean;
};

const $iconButtonStyle: ThemedStyle<ViewStyle> = ({ borderRadius }) => ({
  borderRadius: borderRadius.lg,
});

export function OnboardingFooter({
  text,
  iconName,
  onPress,
  disabled,
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
        iconName={iconName}
        style={themed($iconButtonStyle)}
        onPress={onPress}
        onLongPress={showDebug}
      />
      <OnboardingFooterText color={disabled ? "inactive" : "primary"}>
        {text}
      </OnboardingFooterText>
    </AnimatedVStack>
  );
}
