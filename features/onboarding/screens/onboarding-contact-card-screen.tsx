import React, { useCallback, useEffect, useState } from "react";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { VStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { TextStyle, ViewStyle } from "react-native";
import { useRouter } from "@/navigation/useNavigation";
import { needToShowNotificationsPermissions } from "../Onboarding.utils";
import {
  AuthStatuses,
  useMultiInboxClientStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { useCurrentSender } from "@/features/authentication/account.store";
import { OnboardingCreateContactCard } from "@/features/onboarding/components/onboarding-contact-card";
import { OnboardingContactCardThemeProvider } from "@/features/onboarding/components/onboarding-contact-card-provider";
import logger from "@/utils/logger";
import { captureErrorWithToast } from "@/utils/capture-error";
import { formatRandomUserName } from "@/features/onboarding/utils/format-random-user-name";
import { useAddPfp } from "../hooks/useAddPfp";
import { ProfileType } from "../types/onboarding.types";
import { useCreateOrUpdateProfileInfo } from "../hooks/useCreateOrUpdateProfileInfo";
import { useProfile } from "../hooks/useProfile";
import { ConnectWalletBottomSheet } from "@/features/wallets/connect-wallet.bottom-sheet";
import { useCoinbaseWalletListener } from "@/utils/coinbaseWallet";
import { config } from "@/config";

const $screenContainer: ViewStyle = {
  flex: 1,
};

const $titleContainer: ViewStyle = {
  flex: 1,
};

const $centerContainerStyle: ViewStyle = {
  flex: 1,
  paddingHorizontal: 24,
};

const $subtitleStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
});

export function OnboardingContactCardScreen() {
  const router = useRouter();
  const setAuthStatus = useMultiInboxClientStore((s) => s.setAuthStatus);

  const currentSender = useCurrentSender();
  logger.debug(
    `[OnboardingContactCardScreen] Current sender address: ${currentSender?.ethereumAddress}`
  );

  const { themed, theme } = useAppTheme();
  const { animation } = theme;

  logger.debug(
    `[OnboardingContactCardScreen] Initializing with address: ${currentSender?.ethereumAddress}`
  );

  const { profile, setProfile } = useProfile();
  logger.debug(`[OnboardingContactCardScreen] Current profile:`, profile);
  const { createOrUpdateProfile, loading, errorMessage } =
    useCreateOrUpdateProfileInfo();
  logger.debug(
    `[OnboardingContactCardScreen] Profile update loading: ${loading}, error: ${errorMessage}`
  );

  const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);
  useCoinbaseWalletListener(true, coinbaseUrl);

  useEffect(() => {
    if (errorMessage) {
      logger.error(
        `[OnboardingContactCardScreen] Profile update error: ${errorMessage}`
      );
      captureErrorWithToast(new Error(errorMessage));
    }
  }, [errorMessage]);

  const { addPFP, asset } = useAddPfp();
  logger.debug(`[OnboardingContactCardScreen] Current PFP asset:`, asset);

  const handleRealContinue = useCallback(async () => {
    logger.debug("[OnboardingContactCardScreen] Starting real continue flow");
    try {
      const profileUserName = formatRandomUserName(profile.displayName ?? "");
      const newProfile: ProfileType = {
        ...profile,
        username: profileUserName,
        avatar: asset?.uri,
      };
      logger.debug(
        "[OnboardingContactCardScreen] Creating real profile:",
        newProfile
      );
      const { success } = await createOrUpdateProfile({ profile: newProfile });
      logger.debug(
        `[OnboardingContactCardScreen] Real profile creation success: ${success}`
      );
      if (success) {
        if (needToShowNotificationsPermissions()) {
          logger.debug(
            "[OnboardingContactCardScreen] Navigating to notifications permissions"
          );
          router.push("OnboardingNotifications");
        } else {
          logger.debug(
            "[OnboardingContactCardScreen] Setting auth status to signedIn"
          );
          setAuthStatus(AuthStatuses.signedIn);
        }
      }
    } catch (error) {
      logger.error(
        "[OnboardingContactCardScreen] Error in real continue:",
        error
      );
      captureErrorWithToast(error as Error);
    }
  }, [createOrUpdateProfile, profile, router, asset?.uri, setAuthStatus]);

  const [
    isConnectWalletBottomSheetVisible,
    setIsConnectWalletBottomSheetVisible,
  ] = useState(false);

  const handleImportPress = useCallback(() => {
    alert("Working on this right now 🤙");
    // setIsConnectWalletBottomSheetVisible(true);
  }, []);

  return (
    <>
      <Screen
        preset="scroll"
        contentContainerStyle={$screenContainer}
        safeAreaEdges={["bottom"]}
      >
        <Center style={$centerContainerStyle}>
          <VStack style={$titleContainer}>
            <OnboardingTitle
              // entering={titleAnimation}
              size={"xl"}
            >
              Complete your contact card
            </OnboardingTitle>
            <OnboardingSubtitle
              style={themed($subtitleStyle)}
              // entering={subtitleAnimation}
            >
              Choose how you show up
            </OnboardingSubtitle>

            <OnboardingContactCardThemeProvider>
              <OnboardingCreateContactCard
                onImportPress={handleImportPress}
                addPFP={addPFP}
                pfpUri={asset?.uri}
                displayName={profile.displayName}
                setDisplayName={(displayName) =>
                  setProfile({ ...profile, displayName })
                }
              />
            </OnboardingContactCardThemeProvider>
          </VStack>
        </Center>
        <OnboardingFooter
          text={"Continue"}
          iconName="chevron.right"
          onPress={handleRealContinue}
          disabled={loading || !profile.displayName}
        />
      </Screen>

      <ConnectWalletBottomSheet
        isVisible={isConnectWalletBottomSheetVisible}
        onClose={() => setIsConnectWalletBottomSheetVisible(false)}
        onWalletConnect={(something) => {
          logger.debug(
            "[OnboardingContactCardScreen] Wallet connect:",
            something
          );
        }}
        // onWalletConnect={async (connectHandler) => {
        //   try {
        //     await connectHandler();
        //     listBottomSheetRef.current?.dismiss();
        //   } catch (error) {
        //     logger.error(
        //       "[OnboardingContactCardScreen] Wallet connect error:",
        //       error
        //     );
        //     captureErrorWithToast(error as Error);
        //   }
        // }}
      />
    </>
  );
}
