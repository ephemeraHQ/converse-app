import React, { useCallback, useEffect, useState } from "react";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText, Text } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { TextStyle, ViewStyle } from "react-native";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "@/features/onboarding/constants/animation-constants";
import { useRouter } from "@/navigation/useNavigation";
import { Pressable } from "@/design-system/Pressable";
import { needToShowNotificationsPermissions } from "../Onboarding.utils";
import { setAuthStatus } from "@/data/store/authStore";
import {
  useCurrentAccount,
  useCurrentSender,
  useSafeCurrentSender,
  useSettingsStore,
} from "@/data/store/accountsStore";
import { formatRandoDisplayName } from "@/utils/str";
import { OnboardingCreateContactCard } from "@/features/onboarding/components/onboarding-contact-card";
import { OnboardingContactCardThemeProvider } from "@/features/onboarding/components/onboarding-contact-card-provider";
import logger from "@/utils/logger";
import { captureErrorWithToast } from "@/utils/capture-error";
import { v4 as uuidv4 } from "uuid";
import { formatRandomUserName } from "@/features/onboarding/utils/format-random-user-name";
import { useAddPfp } from "../hooks/useAddPfp";
import { ProfileType } from "../types/onboarding.types";
import { useCreateOrUpdateProfileInfo } from "../hooks/useCreateOrUpdateProfileInfo";
import { useProfile } from "../hooks/useProfile";
import { useSelect } from "@/data/store/storeHelpers";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { Button } from "@/design-system/Button/Button";
import { debugBorder } from "@/utils/debug-style";

const $subtextStyle: TextStyle = {
  textAlign: "center",
};

const $subtextPressableStyle: TextStyle = {
  textAlign: "center",
  textDecorationLine: "underline",
  textDecorationStyle: "dotted",
};

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

  const address = MultiInboxClient.instance.currentSender?.ethereumAddress;
  logger.debug(
    `[OnboardingContactCardScreen] Current sender address: ${address}`
  );

  const { themed, theme } = useAppTheme();
  const { animation } = theme;

  logger.debug(
    `[OnboardingContactCardScreen] Initializing with address: ${address}`
  );

  const { profile, setProfile } = useProfile();
  logger.debug(`[OnboardingContactCardScreen] Current profile:`, profile);
  const { createOrUpdateProfile, loading, errorMessage } =
    useCreateOrUpdateProfileInfo();
  logger.debug(
    `[OnboardingContactCardScreen] Profile update loading: ${loading}, error: ${errorMessage}`
  );

  const titleAnimation = animation
    .fadeInUpSpring()
    .delay(ONBOARDING_ENTERING_DELAY.FIRST)
    .duration(ONBOARDING_ENTERING_DURATION);

  const subtitleAnimation = animation
    .fadeInUpSpring()
    .delay(ONBOARDING_ENTERING_DELAY.SECOND)
    .duration(ONBOARDING_ENTERING_DURATION);

  // const randoDisplayName = formatRandoDisplayName(address ?? "");
  const randoDisplayName = "Rando";
  logger.debug(
    `[OnboardingContactCardScreen] Generated rando display name: ${randoDisplayName}`
  );

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

  const handleRandoContinue = useCallback(async () => {
    logger.debug("[OnboardingContactCardScreen] Starting rando continue flow");
    logger.debug(
      "[OnboardingContactCardScreen] Current sender:",
      MultiInboxClient.instance.currentSender
    );
    try {
      const randomUsername = uuidv4().replace(/-/g, "").slice(0, 30);
      logger.debug(
        `[OnboardingContactCardScreen] Creating rando profile with displayName: ${randoDisplayName}, username: ${randomUsername}`
      );
      const { success } = await createOrUpdateProfile({
        profile: {
          displayName: randoDisplayName,
          username: randomUsername,
        },
      });
      logger.debug(
        `[OnboardingContactCardScreen] Rando profile creation success: ${success}`
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
          setAuthStatus("signedIn");
        }
      }
    } catch (error) {
      logger.error(
        "[OnboardingContactCardScreen] Error in rando continue:",
        error
      );
      captureErrorWithToast(error as Error);
    }
  }, [randoDisplayName, createOrUpdateProfile, router]);

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
          setAuthStatus("signedIn");
        }
      }
    } catch (error) {
      logger.error(
        "[OnboardingContactCardScreen] Error in real continue:",
        error
      );
      captureErrorWithToast(error as Error);
    }
  }, [createOrUpdateProfile, profile, router, asset?.uri]);

  const handleContinue = useCallback(() => {
    logger.debug("[OnboardingContactCardScreen] handleContinue");
    handleRandoContinue();
  }, [handleRandoContinue]);
  const listBottomSheetRef = useBottomSheetModalRef();

  const handleListPress = useCallback(() => {
    listBottomSheetRef.current?.present();
  }, [listBottomSheetRef]);
  const insets = useSafeAreaInsets();

  const currentSender = useCurrentSender();

  return (
    <>
      <Screen
        preset="scroll"
        contentContainerStyle={$screenContainer}
        safeAreaEdges={["bottom"]}
      >
        <Center style={$centerContainerStyle}>
          <VStack style={$titleContainer}>
            <OnboardingTitle entering={titleAnimation} size={"xl"}>
              Complete your contact card
            </OnboardingTitle>
            <OnboardingSubtitle
              style={themed($subtitleStyle)}
              entering={subtitleAnimation}
            >
              Choose how you show up
            </OnboardingSubtitle>

            <OnboardingContactCardThemeProvider>
              <OnboardingCreateContactCard
                onImportPress={handleListPress}
                addPFP={addPFP}
                pfpUri={asset?.uri}
                displayName={profile.displayName}
                setDisplayName={(displayName) =>
                  setProfile({ ...profile, displayName })
                }
              />
            </OnboardingContactCardThemeProvider>

            {/* todo(lustig): bring back when privy supports multiple scws */}
            {/* <AnimatedVStack
            entering={animation
              .fadeInDownSlow()
              .delay(ONBOARDING_ENTERING_DELAY.THIRD)
              .duration(ONBOARDING_ENTERING_DURATION)}
          >
            <AnimatedText style={$subtextStyle} color={"secondary"}>
              {isDoxxedAccount
                ? "Add and edit Contact Cards anytime,"
                : "For everyday conversations,"}
            </AnimatedText>
            <Pressable onPress={toggleType}>
              <AnimatedText style={$subtextPressableStyle} color={"secondary"}>
                {isDoxxedAccount
                  ? "or go Rando for extra privacy."
                  : "use your personal Contact Card."}
              </AnimatedText>
            </Pressable>
          </AnimatedVStack> */}
          </VStack>
        </Center>
        <OnboardingFooter
          text={"Continue"}
          iconName="chevron.right"
          onPress={handleContinue}
          disabled={loading || !profile.displayName}
        />
      </Screen>

      <BottomSheetModal ref={listBottomSheetRef} snapPoints={["50%"]}>
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
    </>
  );
}
