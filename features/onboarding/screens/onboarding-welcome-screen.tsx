import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { memo } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { Button, TextStyle, ViewStyle } from "react-native";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "@/features/onboarding/constants/animation-constants";
import { usePrivy } from "@privy-io/expo";
import { queryClient } from "@/queries/queryClient";
import { useSignupWithPasskey } from "@/features/onboarding/contexts/signup-with-passkey.context";
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

export const OnboardingWelcomeScreen = memo(function OnboardingWelcomeScreen() {
  return <OnboardingWelcomeScreenContent />;
});

const OnboardingWelcomeScreenContent = memo(
  function OnboardingWelcomeScreenContent() {
    const { themed, theme } = useAppTheme();
    const { animation } = theme;

    const { logout: privyLogout } = usePrivy();
    const { signupWithPasskey } = useSignupWithPasskey();

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
              Welcome to Convos
            </OnboardingSubtitle>
            <OnboardingTitle
              style={themed($titleStyle)}
              entering={animation
                .fadeInUpSpring()
                .delay(ONBOARDING_ENTERING_DELAY.SECOND)
                .duration(ONBOARDING_ENTERING_DURATION)}
            >
              Not another chat app
            </OnboardingTitle>
            <AnimatedText
              style={$subtextStyle}
              color={"secondary"}
              entering={animation
                .fadeInDownSlow()
                .delay(ONBOARDING_ENTERING_DELAY.THIRD)
                .duration(ONBOARDING_ENTERING_DURATION)}
            >
              Super secure · Decentralized · Universal
            </AnimatedText>
          </VStack>
        </Center>
        {/* <Button
          onPress={() => {
            loginWithPasskey({
              relyingParty: RELYING_PARTY,
            });
          }}
          title="Login with Passkey"
        /> */}
        <Button
          onPress={() => signupWithPasskey()}
          title="Signup with Passkey"
        />
        <Button
          onPress={() => {
            privyLogout();
            queryClient.removeQueries({
              queryKey: ["embeddedWallet"],
            });
          }}
          title="logout privy"
        />
        {/* <OnboardingFooter
          text={translate("onboarding.welcome.createContactCard")}
          iconName="biometric"
          onPress={() =>
            loginWithPasskey({
              relyingParty: RELYING_PARTY,
            })
          }
          disabled={loading}
        /> */}
      </Screen>
    );
  }
);
