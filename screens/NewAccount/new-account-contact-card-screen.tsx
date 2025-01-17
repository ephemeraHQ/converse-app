import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { translate } from "@/i18n";

import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { memo, useCallback, useEffect, useState } from "react";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@/design-system/Center";
import { animation } from "@/theme/animations";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { TextStyle, ViewStyle } from "react-native";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "@/features/onboarding/constants/animationConstants";
import { useRouter } from "@/navigation/useNavigation";
import { Pressable } from "@/design-system/Pressable";
import { setAuthStatus } from "@/data/store/authStore";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { formatRandoDisplayName } from "@/utils/str";
import { OnboardingContactCard } from "@/features/onboarding/components/onboarding-contact-card";
import { OnboardingContactCardThemeProvider } from "@/features/onboarding/components/onboarding-contact-card-provider";
import logger from "@/utils/logger";
import { captureErrorWithToast } from "@/utils/capture-error";
import { v4 as uuidv4 } from "uuid";
import { formatRandomUserName } from "@/features/onboarding/utils/formatRandomUserName";
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";
import { useCreateOrUpdateProfileInfo } from "@/features/onboarding/hooks/useCreateOrUpdateProfileInfo";
import { useProfile } from "@/features/onboarding/hooks/useProfile";
import { needToShowNotificationsPermissions } from "@/features/onboarding/Onboarding.utils";
import { ProfileType } from "@/features/onboarding/types/onboarding.types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "../Navigation/Navigation";

const $subtextStyle: TextStyle = {
  textAlign: "center",
};

const $subtextPressableStyle: TextStyle = {
  textAlign: "center",
  textDecorationLine: "underline",
  textDecorationStyle: "dotted",
};

const $flex1: ViewStyle = {
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

const titleAnimation = animation
  .fadeInUpSpring()
  .delay(ONBOARDING_ENTERING_DELAY.FIRST)
  .duration(ONBOARDING_ENTERING_DURATION);

const subtitleAnimation = animation
  .fadeInUpSpring()
  .delay(ONBOARDING_ENTERING_DELAY.SECOND)
  .duration(ONBOARDING_ENTERING_DURATION);

export const NewAccountContactCardScreen = memo(
  function NewAccountUserProfileScreen(
    props: NativeStackScreenProps<NavigationParamList, "NewAccountContactCard">
  ) {
    const { navigation } = props;

    const router = useRouter();

    const address = useCurrentAccount()!;

    const { themed } = useAppTheme();

    const [type, setType] = useState<"real" | "rando">("real");

    const toggleType = useCallback(() => {
      setType((prev) => (prev === "real" ? "rando" : "real"));
    }, []);

    const { createOrUpdateProfile, loading, errorMessage } =
      useCreateOrUpdateProfileInfo();

    const { profile, setProfile } = useProfile();

    const randoDisplayName = formatRandoDisplayName(address);

    const handleError = useCallback((error: Error) => {
      logger.error(error);
      captureErrorWithToast(error);
    }, []);

    useEffect(() => {
      if (errorMessage) {
        handleError(new Error(errorMessage));
      }
    }, [errorMessage, handleError]);

    const { addPFP, asset } = useAddPfp();

    const handleRandoContinue = useCallback(async () => {
      try {
        const randomUsername = uuidv4().replace(/-/g, "").slice(0, 30);
        logger.debug(
          "[NewAccountContactCardScreen] handleRandoContinue",
          randoDisplayName
        );
        const { success } = await createOrUpdateProfile({
          profile: {
            displayName: randoDisplayName,
            username: randomUsername,
          },
        });
        logger.debug(
          "[NewAccountContactCardScreen] handleRandoContinue success",
          success
        );
        if (success) {
          navigation.popTo("Chats");
        }
      } catch (error) {
        handleError(error as Error);
      }
    }, [randoDisplayName, createOrUpdateProfile, navigation, handleError]);

    const handleRealContinue = useCallback(async () => {
      try {
        const profileUserName = formatRandomUserName(profile.displayName ?? "");
        const newProfile: ProfileType = {
          ...profile,
          username: profileUserName,
          avatar: asset?.uri,
        };
        const { success } = await createOrUpdateProfile({
          profile: newProfile,
        });
        if (success) {
          if (needToShowNotificationsPermissions()) {
            router.push("OnboardingNotifications");
          } else {
            setAuthStatus("signedIn");
          }
        }
      } catch (error) {
        handleError(error as Error);
      }
    }, [createOrUpdateProfile, profile, router, handleError, asset?.uri]);

    const handleContinue = useCallback(() => {
      logger.debug("[NewAccountContactCardScreen] handleContinue", type);
      if (type === "real") {
        handleRealContinue();
      } else {
        handleRandoContinue();
      }
    }, [type, handleRealContinue, handleRandoContinue]);

    return (
      <Screen
        preset="scroll"
        contentContainerStyle={$flex1}
        safeAreaEdges={["bottom"]}
      >
        <Center style={$centerContainerStyle}>
          <VStack style={$flex1}>
            {type === "real" ? (
              <OnboardingTitle entering={titleAnimation} size={"xl"}>
                {translate("onboarding.contactCard.title")}
              </OnboardingTitle>
            ) : (
              <OnboardingTitle entering={titleAnimation} size={"xl"}>
                {translate("onboarding.contactCard.randoTitle")}
              </OnboardingTitle>
            )}
            {type === "real" ? (
              <OnboardingSubtitle
                style={themed($subtitleStyle)}
                entering={subtitleAnimation}
              >
                {translate("onboarding.contactCard.subtitle")}
              </OnboardingSubtitle>
            ) : (
              <OnboardingSubtitle
                style={themed($subtitleStyle)}
                entering={subtitleAnimation}
              >
                {translate("onboarding.contactCard.randoSubtitle")}
              </OnboardingSubtitle>
            )}
            <OnboardingContactCardThemeProvider>
              {type === "real" ? (
                <OnboardingContactCard
                  addPFP={addPFP}
                  pfpUri={asset?.uri}
                  displayName={profile.displayName}
                  setDisplayName={(displayName) =>
                    setProfile({ ...profile, displayName })
                  }
                />
              ) : (
                <OnboardingContactCard
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
                  ? translate("onboarding.contactCard.body")
                  : translate("onboarding.contactCard.randoBody")}
              </AnimatedText>
              <Pressable onPress={toggleType}>
                <AnimatedText
                  style={$subtextPressableStyle}
                  color={"secondary"}
                >
                  {type === "real"
                    ? translate("onboarding.contactCard.bodyPressable")
                    : translate("onboarding.contactCard.randoPressable")}
                </AnimatedText>
              </Pressable>
            </AnimatedVStack>
          </VStack>
        </Center>
        <OnboardingFooter
          text={translate("onboarding.contactCard.continue")}
          iconName="chevron.right"
          onPress={handleContinue}
          disabled={loading || (type === "real" && !profile.displayName)}
        />
      </Screen>
    );
  }
);
