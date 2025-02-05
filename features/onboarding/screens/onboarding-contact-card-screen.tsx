import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { useCallback, useEffect, useState } from "react";
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

  // const address = useCurrentAccount()!;
  const address = MultiInboxClient.instance.currentSender?.ethereumAddress;

  const { themed, theme } = useAppTheme();
  const { animation } = theme;

  logger.debug("OnboardingContactCardScreen", {
    address,
  });
  const { setIsRandoAccount, isRandoAccount } = useSettingsStore(
    useSelect(["setIsRandoAccount", "isRandoAccount"])
  );

  const { createOrUpdateProfile, loading, errorMessage } =
    useCreateOrUpdateProfileInfo();

  const toggleType = useCallback(() => {
    if (!loading) {
      setIsRandoAccount(!isRandoAccount);
    }
  }, [loading, setIsRandoAccount, isRandoAccount]);

  const titleAnimation = animation
    .fadeInUpSpring()
    .delay(ONBOARDING_ENTERING_DELAY.FIRST)
    .duration(ONBOARDING_ENTERING_DURATION);

  const subtitleAnimation = animation
    .fadeInUpSpring()
    .delay(ONBOARDING_ENTERING_DELAY.SECOND)
    .duration(ONBOARDING_ENTERING_DURATION);

  const { profile, setProfile } = useProfile();

  const randoDisplayName = formatRandoDisplayName(address ?? "");

  useEffect(() => {
    if (errorMessage) {
      captureErrorWithToast(new Error(errorMessage));
    }
  }, [errorMessage]);

  const { addPFP, asset } = useAddPfp();

  const handleRandoContinue = useCallback(async () => {
    logger.debug("[OnboardingContactCardScreen] handleRandoContinue");
    logger.debug(MultiInboxClient.instance.currentSender);
    try {
      const randomUsername = uuidv4().replace(/-/g, "").slice(0, 30);
      logger.debug(
        "[OnboardingContactCardScreen] handleRandoContinue",
        randoDisplayName
      );
      const { success } = await createOrUpdateProfile({
        profile: {
          displayName: randoDisplayName,
          username: randomUsername,
        },
      });
      logger.debug(
        "[OnboardingContactCardScreen] handleRandoContinue success",
        success
      );
      if (success) {
        if (needToShowNotificationsPermissions()) {
          router.push("OnboardingNotifications");
        } else {
          setAuthStatus("signedIn");
        }
      }
    } catch (error) {
      captureErrorWithToast(error as Error);
    }
  }, [randoDisplayName, createOrUpdateProfile, router]);

  const handleRealContinue = useCallback(async () => {
    try {
      const profileUserName = formatRandomUserName(profile.displayName ?? "");
      const newProfile: ProfileType = {
        ...profile,
        username: profileUserName,
        avatar: asset?.uri,
      };
      const { success } = await createOrUpdateProfile({ profile: newProfile });
      if (success) {
        if (needToShowNotificationsPermissions()) {
          router.push("OnboardingNotifications");
        } else {
          setAuthStatus("signedIn");
        }
      }
    } catch (error) {
      captureErrorWithToast(error as Error);
    }
  }, [createOrUpdateProfile, profile, router, asset?.uri]);

  const handleContinue = useCallback(() => {
    logger.debug(
      "[OnboardingContactCardScreen] handleContinue",
      isRandoAccount
    );
    if (isRandoAccount) {
      handleRandoContinue();
    } else {
      handleRealContinue();
    }
  }, [isRandoAccount, handleRealContinue, handleRandoContinue]);

  const isDoxxedAccount = !isRandoAccount;

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={$screenContainer}
      safeAreaEdges={["bottom"]}
    >
      <Center style={$centerContainerStyle}>
        <VStack style={$titleContainer}>
          {isDoxxedAccount ? (
            <OnboardingTitle entering={titleAnimation} size={"xl"}>
              Complete your contact card
            </OnboardingTitle>
          ) : (
            <OnboardingTitle entering={titleAnimation} size={"xl"}>
              Go Rando
            </OnboardingTitle>
          )}
          {isDoxxedAccount ? (
            <OnboardingSubtitle
              style={themed($subtitleStyle)}
              entering={subtitleAnimation}
            >
              Choose how you show up
            </OnboardingSubtitle>
          ) : (
            <OnboardingSubtitle
              style={themed($subtitleStyle)}
              entering={subtitleAnimation}
            >
              Chat using random contact info
            </OnboardingSubtitle>
          )}
          <OnboardingContactCardThemeProvider>
            {isDoxxedAccount ? (
              <OnboardingCreateContactCard
                addPFP={addPFP}
                pfpUri={isDoxxedAccount ? asset?.uri : undefined}
                displayName={profile.displayName}
                setDisplayName={(displayName) =>
                  setProfile({ ...profile, displayName })
                }
              />
            ) : (
              <OnboardingCreateContactCard
                editable={false}
                addPFP={() => {}}
                pfpUri={undefined}
                displayName={randoDisplayName}
                setDisplayName={() => {}}
              />
            )}
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
        disabled={loading || (!isDoxxedAccount && !profile.displayName)}
      />
    </Screen>
  );
}
