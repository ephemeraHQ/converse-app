import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { memo, useCallback, useEffect } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { Button, TextStyle, ViewStyle } from "react-native";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "@/features/onboarding/constants/animation-constants";
import { useRouter } from "@/navigation/useNavigation";
import { useCreatePasskey } from "@/features/onboarding/passkey/useCreatePasskey";
import {
  PasskeyAuthStoreProvider,
  usePasskeyAuthStoreContext,
} from "@/features/onboarding/passkey/passkeyAuthStore";
import logger from "@/utils/logger";
import { captureErrorWithToast } from "@/utils/capture-error";
import { usePrivySmartWalletConnection } from "../Privy/usePrivySmartWalletConnection";
import {
  useLoginWithPasskey,
  useSignupWithPasskey,
} from "@privy-io/expo/passkey";
import { RELYING_PARTY } from "../passkey/passkey.constants";
import { usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { checkUsernameValid } from "@/utils/api/profiles";

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
    <PasskeyAuthStoreProvider>
      <OnboardingWelcomeScreenContent />
    </PasskeyAuthStoreProvider>
  );
});

const OnboardingWelcomeScreenContent = memo(
  function OnboardingWelcomeScreenContent() {
    const { themed, theme } = useAppTheme();
    const { animation } = theme;

    const router = useRouter();

    const loading = usePasskeyAuthStoreContext((state) => state.loading);

    // const { createPasskey: handleCreateAccountWithPasskey } =

    //   useCreatePasskey();
    const { user, logout } = usePrivy();
    // logout();

    const { client: privySmartWalletClient } = useSmartWallets();
    const { signupWithPasskey } = useSignupWithPasskey({
      onSuccess: (privyUser, isNewUser) => {
        logger.debug(
          "[OnboardingWelcomeScreenContent] Successfully signed up with passkey",
          privyUser,
          isNewUser
        );
        logger.debug(
          "[OnboardingWelcomeScreenContent] privySmartWalletClient",
          privySmartWalletClient
        );
        // create an embedded wallet
        // once embedded wallet is created,
        // create a smart contract wallet
        // once the smart contract wallet is created,
        // call multiInboxClient.initialize

        // router.replace("OnboardingCreateContactCard");
      },
      onError: (error) => {
        logger.error(
          "[OnboardingWelcomeScreenContent] Error signing up with passkey",
          error
        );
        captureErrorWithToast(error);
      },
    });

    const { loginWithPasskey } = useLoginWithPasskey({
      onSuccess: (privyUser, isNewUser) => {
        logger.debug(
          "[OnboardingWelcomeScreenContent] Successfully logged in with passkey",
          privyUser,
          isNewUser
        );
        router.replace("OnboardingCreateContactCard");
      },
      onError: (error) => {
        logger.error(
          "[OnboardingWelcomeScreenContent] Error logging in with passkey",
          error
        );
        captureErrorWithToast(error);
      },
    });

    const setError = usePasskeyAuthStoreContext((state) => state.setError);

    const handleError = useCallback(
      (error: Error) => {
        setError(error.message);
        captureErrorWithToast(error);
      },
      [setError]
    );

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

    // usePrivySmartWalletConnection({
    //   onConnectionDone,
    //   onConnectionError,
    //   onStatusChange,
    // });
    /*

        welcome: {
      title: "Become unspammable",
      subtitle: "Welcome to Convos",
      subtext: "Simple · Secure · Universal",
      createContactCard: "Create a Contact Card",
    },

    */

    // useEffect(() => {
    //   // MultiInboxClient.instance.initialize({
    //   //   ethereumAddress: getCurrentAccount()!,
    //   // });
    //   async function check() {
    //     logger.debug(
    //       "[OnboardingWelcomeScreenContent] Checking username validity for test user"
    //     );
    //     try {
    //       const result = await checkUsernameValid({
    //         address: undefined,
    //         username: "testmrmcdreamy",
    //       });
    //       logger.debug(
    //         `[OnboardingWelcomeScreenContent] Username validity check result: ${JSON.stringify(
    //           result,
    //           null,
    //           2
    //         )}`
    //       );
    //     } catch (error) {
    //       logger.error(
    //         `[OnboardingWelcomeScreenContent] Error checking username validity: ${error}`
    //       );
    //     }
    //   }

    //   check();
    // }, []);

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
        <Button
          onPress={() => {
            loginWithPasskey({
              relyingParty: RELYING_PARTY,
            });
          }}
          title="Login with Passkey"
        />
        <Button
          onPress={() =>
            signupWithPasskey({
              relyingParty: RELYING_PARTY,
            })
          }
          title="Signup with Passkey"
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
