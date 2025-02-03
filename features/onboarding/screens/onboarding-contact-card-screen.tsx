import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { translate } from "@/i18n";

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
import { useCurrentAccount } from "@/data/store/accountsStore";
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

  const address = useCurrentAccount()!;

  const { themed, theme } = useAppTheme();
  const { animation } = theme;
  const [type, setType] = useState<"real" | "rando">("real");

  const { createOrUpdateProfile, loading, errorMessage } =
    useCreateOrUpdateProfileInfo();

  const toggleType = useCallback(() => {
    if (!loading) {
      setType((prev) => (prev === "real" ? "rando" : "real"));
    }
  }, [loading]);

  const titleAnimation = animation
    .fadeInUpSpring()
    .delay(ONBOARDING_ENTERING_DELAY.FIRST)
    .duration(ONBOARDING_ENTERING_DURATION);

  const subtitleAnimation = animation
    .fadeInUpSpring()
    .delay(ONBOARDING_ENTERING_DELAY.SECOND)
    .duration(ONBOARDING_ENTERING_DURATION);

  const { profile, setProfile } = useProfile();

  const randoDisplayName = formatRandoDisplayName(address);

  useEffect(() => {
    if (errorMessage) {
      captureErrorWithToast(new Error(errorMessage));
    }
  }, [errorMessage]);

  const { addPFP, asset } = useAddPfp();

  const handleRandoContinue = useCallback(async () => {
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
    logger.debug("[OnboardingContactCardScreen] handleContinue", type);
    if (type === "real") {
      handleRealContinue();
    } else {
      handleRandoContinue();
    }
  }, [type, handleRealContinue, handleRandoContinue]);

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={$screenContainer}
      safeAreaEdges={["bottom"]}
    >
      <Center style={$centerContainerStyle}>
        <VStack style={$titleContainer}>
          {type === "real" ? (
            <OnboardingTitle entering={titleAnimation} size={"xl"}>
              {translate("contactCard.title")}
            </OnboardingTitle>
          ) : (
            <OnboardingTitle entering={titleAnimation} size={"xl"}>
              {translate("contactCard.randoTitle")}
            </OnboardingTitle>
          )}
          {type === "real" ? (
            <OnboardingSubtitle
              style={themed($subtitleStyle)}
              entering={subtitleAnimation}
            >
              {translate("contactCard.subtitle")}
            </OnboardingSubtitle>
          ) : (
            <OnboardingSubtitle
              style={themed($subtitleStyle)}
              entering={subtitleAnimation}
            >
              {translate("contactCard.randoSubtitle")}
            </OnboardingSubtitle>
          )}
          <OnboardingContactCardThemeProvider>
            {type === "real" ? (
              <OnboardingCreateContactCard
                addPFP={addPFP}
                pfpUri={type === "real" ? asset?.uri : undefined}
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
          <AnimatedVStack
            entering={animation
              .fadeInDownSlow()
              .delay(ONBOARDING_ENTERING_DELAY.THIRD)
              .duration(ONBOARDING_ENTERING_DURATION)}
          >
            <AnimatedText style={$subtextStyle} color={"secondary"}>
              {type === "real"
                ? translate("contactCard.body")
                : translate("contactCard.randoBody")}
            </AnimatedText>
            <Pressable onPress={toggleType}>
              <AnimatedText style={$subtextPressableStyle} color={"secondary"}>
                {type === "real"
                  ? translate("contactCard.bodyPressable")
                  : translate("contactCard.randoPressable")}
              </AnimatedText>
            </Pressable>
          </AnimatedVStack>
        </VStack>
      </Center>
      <OnboardingFooter
        text={translate("contactCard.continue")}
        iconName="chevron.right"
        onPress={handleContinue}
        disabled={loading || (type === "real" && !profile.displayName)}
      />
    </Screen>
  );
}
