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

function WalletBottomSheet({
  isVisible,
  onClose,
  currentSender,
}: WalletBottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useBottomSheetModalRef();

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, bottomSheetRef]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["50%"]}
      onDismiss={onClose}
    >
      <BottomSheetHeader title="Import an identity" />
      <BottomSheetContentContainer
        style={{
          flex: 1,
        }}
      >
        <VStack
          style={{
            paddingHorizontal: theme.spacing.md,
            rowGap: theme.spacing.xs,
            paddingBottom: insets.bottom,
          }}
        >
          {currentSender ? (
            <Text>
              {JSON.stringify(currentSender)}
              show the installed wallets that we support [coinbase, metamask,
              rainbow to link]
            </Text>
          ) : (
            <Text>Loading XMTP client...</Text>
          )}
        </VStack>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}

export const OnboardingWelcomeScreen = memo(function OnboardingWelcomeScreen() {
  return <OnboardingWelcomeScreenContent />;
});

const OnboardingWelcomeScreenContent = memo(
  function OnboardingWelcomeScreenContent() {
    const { themed, theme } = useAppTheme();
    const { animation } = theme;

    const { logout: privyLogout, user: privyUser } = usePrivy();
    const { signupWithPasskey } = useSignupWithPasskey();
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
              await signupWithPasskey();
              // @ts-ignore
              navigation.replace("OnboardingCreateContactCard");
            }}
            title="Signup with Passkey"
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
