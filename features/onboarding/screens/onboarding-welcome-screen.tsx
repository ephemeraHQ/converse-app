import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { memo, useState, useEffect, useCallback } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { Button, TextStyle, ViewStyle, Text } from "react-native";
import { usePrivy } from "@privy-io/expo";
import { queryClient } from "@/queries/queryClient";
import { useSignupWithPasskey } from "@/features/onboarding/contexts/signup-with-passkey.context";
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useNavigation } from "@react-navigation/native";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { RELYING_PARTY } from "../passkey.constants";
import { useLogout } from "@/utils/logout";
import {
  AuthStatuses,
  deleteStores,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import mmkv from "@/utils/mmkv";
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
    const { logout } = useLogout();
    const { animation } = theme;

    const { signupWithPasskey, loginWithPasskey } = useSignupWithPasskey();
    const navigation = useNavigation();

    return (
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
              await signupWithPasskey();
              // @ts-ignore
              navigation.replace("OnboardingCreateContactCard");
            } catch (error) {
              console.log("error", error);
            }
          }}
          title="Signup with Passkey"
        />

        <Button
          onPress={async () => {
            try {
              await loginWithPasskey();
            } catch (error) {
              console.log("error", error);
            }
          }}
          title="Sign in with passkey"
        />

        <Button
          onPress={async () => {
            const currentAccount = useAccountsStore.getState().currentSender;
            if (currentAccount) {
              deleteStores(currentAccount.ethereumAddress);
            }
            await logout();
            // delete all queries
            // delete all stores
            // delete all mmkv

            queryClient.clear();
            mmkv.clearAll();
          }}
          title="dleete everything"
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
