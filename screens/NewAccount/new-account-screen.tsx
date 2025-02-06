import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { translate } from "@/i18n";

import { VStack } from "@/design-system/VStack";
import { memo, useCallback } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { TextStyle, ViewStyle } from "react-native";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "@/features/onboarding/constants/animation-constants";
import { useRouter } from "@/navigation/useNavigation";

const $subtextStyle: TextStyle = {
  textAlign: "center",
};

const $screenContainer: ViewStyle = {
  flex: 1,
};

const $titleContainer: ViewStyle = {
  flex: 1,
};

const $titleStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
});

export const NewAccountScreen = memo(function NewAccountWelcomeScreen() {
  return <NewAccountScreenContent />;
});

const NewAccountScreenContent = memo(function NewAccountScreenContent() {
  const { themed, theme } = useAppTheme();
  const { animation } = theme;

  const router = useRouter();

  // const { createPasskey: handleCreateAccountWithPasskey } = useCreatePasskey();

  return (
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={$screenContainer}
      preset="scroll"
    >
      <Center style={$titleContainer}>
        <VStack>
          <OnboardingSubtitle
            entering={animation
              .fadeInUpSpring()
              .delay(ONBOARDING_ENTERING_DELAY.FIRST)
              .duration(ONBOARDING_ENTERING_DURATION)}
          >
            {translate("onboarding.welcome.subtitle")}
          </OnboardingSubtitle>
          <OnboardingTitle
            style={themed($titleStyle)}
            entering={animation
              .fadeInUpSpring()
              .delay(ONBOARDING_ENTERING_DELAY.SECOND)
              .duration(ONBOARDING_ENTERING_DURATION)}
          >
            {translate("onboarding.welcome.title")}
          </OnboardingTitle>
          <AnimatedText
            style={$subtextStyle}
            color={"secondary"}
            entering={animation
              .fadeInDownSlow()
              .delay(ONBOARDING_ENTERING_DELAY.THIRD)
              .duration(ONBOARDING_ENTERING_DURATION)}
          >
            {translate("onboarding.welcome.subtext")}
          </AnimatedText>
        </VStack>
      </Center>
      {/* <OnboardingFooter
        text={translate("onboarding.welcome.createContactCard")}
        iconName="biometric"
        onPress={handleCreateAccountWithPasskey}
        disabled={loading}
      /> */}
    </Screen>
  );
});
