import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { Center } from "@/design-system/Center";
import { VStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { useLogout } from "@/utils/logout";
import { useNavigation } from "@react-navigation/native";
import { memo, useState } from "react";
import { Button, TextStyle, ViewStyle } from "react-native";
import { useLoginWithPasskey } from "@/features/onboarding/hooks/use-login-with-passkey";
import { useSignupWithPasskey } from "@/features/onboarding/hooks/use-signup-with-passkey";
import { captureErrorWithToast } from "@/utils/capture-error";

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

    const { signup } = useSignupWithPasskey();
    const { login } = useLoginWithPasskey();

    const navigation = useNavigation();

    const [isVisible, setIsVisible] = useState(true);

    return (
      <Screen
        safeAreaEdges={["bottom"]}
        contentContainerStyle={$screenContainer}
        preset="scroll"
      >
        {/* <ConnectWalletBottomSheet
          isVisible={isVisible}
          onClose={() => {
            setIsVisible(false);
          }}
          onWalletConnect={() => {}}
        /> */}
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
              await signup();
              // @ts-ignore
              navigation.replace("OnboardingCreateContactCard");
            } catch (error) {
              captureErrorWithToast(error);
            }
          }}
          title="Signup with Passkey"
        />

        <Button
          onPress={async () => {
            try {
              await login();
            } catch (error) {
              captureErrorWithToast(error);
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
