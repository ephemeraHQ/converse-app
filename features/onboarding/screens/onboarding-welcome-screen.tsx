import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { memo, useState, useEffect, useCallback } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { Button, TextStyle, ViewStyle, Text } from "react-native";
// import {
//   ONBOARDING_ENTERING_DELAY,
//   ONBOARDING_ENTERING_DURATION,
// } from "@/features/onboarding/constants/animation-constants";
import { usePrivy } from "@privy-io/expo";
import { queryClient } from "@/queries/queryClient";
import { useSignupWithPasskey } from "@/features/onboarding/contexts/signup-with-passkey.context";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { RELYING_PARTY } from "../passkey.constants";
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

type WalletBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  currentSender?: any; // Replace with proper type
};

export const OnboardingWelcomeScreen = memo(function OnboardingWelcomeScreen() {
  return <OnboardingWelcomeScreenContent />;
});

const OnboardingWelcomeScreenContent = memo(
  function OnboardingWelcomeScreenContent() {
    const { themed, theme } = useAppTheme();
    const { animation } = theme;

    const { logout: privyLogout, user: privyUser } = usePrivy();
    const { loginWithPasskey: privySigninWithPasskey } =
      usePrivyLoginWithPasskey();
    const { signupWithPasskey: privySignupWithPasskey } =
      usePrivySignupWithPasskey();

    // const { signupWithPasskey } = useSignupWithPasskey();
    const navigation = useNavigation();

    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

    const handleImportPress = useCallback(() => {
      setIsBottomSheetVisible(true);
    }, []);

    return (
      <>
        <Screen
          safeAreaEdges={["bottom"]}
          contentContainerStyle={$screenContainer}
          preset="scroll"
        >
          <Center style={$titleContainer}>
            <VStack>
              <OnboardingSubtitle
              // entering={animation
              //   .fadeInUpSpring()
              //   .delay(ONBOARDING_ENTERING_DELAY.FIRST)
              //   .duration(ONBOARDING_ENTERING_DURATION)}
              >
                Welcome to Convos
              </OnboardingSubtitle>
              <Text>{JSON.stringify(privyUser, null, 2)}</Text>
              <OnboardingTitle
                style={themed($titleStyle)}
                // entering={animation
                //   .fadeInUpSpring()
                //   .delay(ONBOARDING_ENTERING_DELAY.SECOND)
                //   .duration(ONBOARDING_ENTERING_DURATION)}
              >
                Not another chat app
              </OnboardingTitle>
              <AnimatedText
                style={$subtextStyle}
                color={"secondary"}
                // entering={animation
                //   .fadeInDownSlow()
                //   .delay(ONBOARDING_ENTERING_DELAY.THIRD)
                //   .duration(ONBOARDING_ENTERING_DURATION)}
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
            onPress={async () => {
              try {
                await privySignupWithPasskey({
                  relyingParty: RELYING_PARTY,
                });
                // await signupWithPasskey();
                // // @ts-ignore
                // navigation.replace("OnboardingCreateContactCard");
              } catch (error) {
                console.log("error", error);
              }
            }}
            title="Signup with Passkey"
          />

          <Button
            onPress={async () => {
              try {
                await privySigninWithPasskey({
                  relyingParty: RELYING_PARTY,
                });
              } catch (error) {
                console.log("error", error);
              }
            }}
            title="Sign in with passkey"
          />

          <Button
            onPress={async () => {
              await privyLogout();
              queryClient.removeQueries({
                queryKey: ["embeddedWallet"],
              });

              MultiInboxClient.instance.logoutMessagingClients();
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
      </>
    );
  }
);
