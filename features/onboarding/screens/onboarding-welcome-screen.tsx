import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Text } from "@/design-system/Text";

import { translate } from "@/i18n";

import { VStack } from "@/design-system/VStack";
import { memo, useCallback } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { TextStyle, ViewStyle } from "react-native";
import { useRouter } from "@/navigation/useNavigation";
import { usePrivySmartWalletConnection } from "@/features/onboarding/Privy/usePrivySmartWalletConnection";
import { PrivyAuthStoreProvider } from "@/features/onboarding/Privy/privyAuthStore";
import logger from "@/utils/logger";
import { captureErrorWithToast } from "@/utils/capture-error";
import { Button } from "@/design-system/Button/Button";
import { usePrivy } from "@privy-io/expo";

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
  return (
    <PrivyAuthStoreProvider>
      <OnboardingWelcomeScreenContent />
    </PrivyAuthStoreProvider>
  );
});

const OnboardingWelcomeScreenContent = memo(
  function OnboardingWelcomeScreenContent() {
    const { themed, theme } = useAppTheme();
    const { animation } = theme;

    const { user, logout: logoutPrivy } = usePrivy();
    const router = useRouter();

    // const loading = usePasskeyAuthStoreContext((state) => state.loading);

    // const { createPasskey: handleCreateAccountWithPasskey } =
    //   useCreatePasskey();
    // useSignupWithPasskey

    // const setError = usePasskeyAuthStoreContext((state) => state.setError);
    // const { loginWithPasskey } = useLoginWithPasskey();

    const handleError = useCallback((error: Error) => {
      captureErrorWithToast(error);
    }, []);

    // const handleLoginWithPasskey = useCallback(() => {
    //   logger.debug("[OnboardingWelcomeScreenContent] handleLoginWithPasskey");
    //   loginWithPasskey();
    // }, [loginWithPasskey]);

    const onStatusChange = useCallback((status: string) => {
      logger.debug("[OnboardingWelcomeScreenContent] onStatusChange", status);
    }, []);

    const onConnectionDone = useCallback(() => {
      logger.debug("[OnboardingWelcomeScreenContent] onConnectionDone");
      router.replace("OnboardingCreateContactCard");
    }, [router]);

    const onConnectionError = useCallback(
      (error: Error) => {
        handleError(error);
      },
      [handleError]
    );

    usePrivySmartWalletConnection({
      onConnectionDone,
      onConnectionError,
      onStatusChange,
    });

    return (
      <Screen
        safeAreaEdges={["bottom"]}
        contentContainerStyle={$screenContainer}
        preset="scroll"
      >
        <Center style={$titleContainer}>
          <VStack>
            {/* <OnboardingFooter
              text={translate("onboarding.welcome.createContactCard")}
              iconName="biometric"
              onPress={handleCreateAccountWithPasskey}
              disabled={loading}
            /> */}

            {/* <Text>{JSON.stringify(user, null, 2)}</Text> */}
            <Text>{user?.id || "no privy user"}</Text>

            {user?.id && <Button onPress={logoutPrivy}>logout privy</Button>}
            {/* {!user?.id && (
              <Button onPress={handleLoginWithPasskey}>login privy</Button>
            )} */}
          </VStack>
          {/* <VStack>
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
          </VStack> */}
        </Center>
      </Screen>
    );
  }
);
