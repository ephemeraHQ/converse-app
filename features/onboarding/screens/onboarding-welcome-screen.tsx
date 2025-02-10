import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { memo } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { Button, TextStyle, ViewStyle } from "react-native";
import { useSignupWithPasskey } from "@/features/onboarding/contexts/signup-with-passkey.context";
import { useNavigation } from "@react-navigation/native";
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
      </Screen>
    );
  }
);
