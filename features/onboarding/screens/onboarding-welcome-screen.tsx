import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { memo, useState } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { Button, TextStyle, ViewStyle } from "react-native";
import { useAuthenticateWithPasskey } from "@/features/onboarding/contexts/signup-with-passkey.context";
import { useNavigation } from "@react-navigation/native";
import { useLogout } from "@/utils/logout";
import { ConnectWalletBottomSheet } from "@/features/wallets/connect-wallet.bottom-sheet";
import { logger } from "@/utils/logger";
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
    const { themed } = useAppTheme();
    const { logout } = useLogout();

    const { signupWithPasskey, loginWithPasskey } =
      useAuthenticateWithPasskey();
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
          onWalletImported={(stuff) => {
            logger.debug(
              `[OnboardingWelcomeScreen] Wallet imported: ${JSON.stringify(
                stuff,
                null,
                2
              )}`
            );
          }}
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
          title="Clear Stuff and Restart (use this if you get in a funky state)"
          onPress={() => {
            logout();
          }}
        />
      </Screen>
    );
  }
);
