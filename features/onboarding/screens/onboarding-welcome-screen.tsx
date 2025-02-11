import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { memo, useEffect, useState } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { Button, TextStyle, ViewStyle } from "react-native";
import { useSignupWithPasskey } from "@/features/onboarding/contexts/signup-with-passkey.context";
import { useNavigation } from "@react-navigation/native";
import { useLogout } from "@/utils/logout";
import { ensureProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { lookupCoinbaseId } from "@/utils/evm/address";
import logger from "@/utils/logger";
import { ConnectWalletBottomSheet } from "@/features/wallets/connect-wallet.bottom-sheet";
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

import { useSocialProfiles } from "thirdweb/react";
import { thirdwebClient } from "@/utils/thirdweb";
const mycbidaddress1 = "0aF849d2778f6ccE4A2641438B6207DC4750a82B";
const mycbidaddress = "0x0aF849d2778f6ccE4A2641438B6207DC4750a82B";
const OnboardingWelcomeScreenContent = memo(
  function OnboardingWelcomeScreenContent() {
    const { themed } = useAppTheme();
    const { logout } = useLogout();

    const {
      data: profiles,
      status,
      error,
    } = useSocialProfiles({
      client: thirdwebClient,
      address: mycbidaddress1,
    });
    logger.debug(
      "[OnboardingWelcomeScreenContent] Profiles:",
      JSON.stringify(profiles, null, 2)
    );
    logger.debug("[OnboardingWelcomeScreenContent] Status:", status);
    logger.debug("[OnboardingWelcomeScreenContent] Error:", error);

    useEffect(() => {
      async function stuff() {
        // const inboxClient = MultiInboxClient.instance.getInboxClientForAddress({
        //   ethereumAddress: currentSender!.ethereumAddress,
        // });

        // await currentInboxClient?.addAccount(signer);
        const cbId = await lookupCoinbaseId(mycbidaddress);
        logger.debug(
          `[ConnectWalletBottomSheet] Coinbase ID for address ${mycbidaddress}: ${cbId}`
        );

        const socialData = await ensureProfileSocialsQueryData(mycbidaddress);
        logger.debug(
          `[ConnectWalletBottomSheet] Social data for address ${mycbidaddress}:`,
          JSON.stringify(socialData, null, 2)
        );
      }

      stuff();
    }, []);

    const { signupWithPasskey, loginWithPasskey } = useSignupWithPasskey();
    const navigation = useNavigation();

    const [isVisible, setIsVisible] = useState(true);

    return (
      <Screen
        safeAreaEdges={["bottom"]}
        contentContainerStyle={$screenContainer}
        preset="scroll"
      >
        <ConnectWalletBottomSheet
          isVisible={isVisible}
          onClose={() => {
            setIsVisible(false);
          }}
          onWalletConnect={() => {}}
        />
        <Center style={$titleContainer}>
          <VStack>
            <OnboardingSubtitle>Welcome to Convos</OnboardingSubtitle>
            <OnboardingTitle style={themed($titleStyle)}>
              Not another chat app
            </OnboardingTitle>
            <AnimatedText style={$subtextStyle} color={"secondary"}>
              Super secure · Decentralized · Universal
            </AnimatedText>
          </VStack>
        </Center>

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
          title="log out"
          onPress={() => {
            logout();
          }}
        />
      </Screen>
    );
  }
);
