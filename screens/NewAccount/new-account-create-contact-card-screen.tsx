import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedText } from "@/design-system/Text";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";

import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { memo, useCallback, useEffect, useState } from "react";
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
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";
import { useCreateOrUpdateProfileInfo } from "@/features/onboarding/hooks/useCreateOrUpdateProfileInfo";
import { useProfile } from "@/features/onboarding/hooks/useProfile";
import { ProfileType } from "@/features/onboarding/types/onboarding.types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "../Navigation/Navigation";
import { useSelect } from "@/data/store/storeHelpers";

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

export const NewAccountCreateContactCardScreen = memo(
  function NewAccountUserProfileScreen(
    props: NativeStackScreenProps<
      NavigationParamList,
      "NewAccountCreateContactCard"
    >
  ) {
    const { navigation } = props;

    const address = useCurrentAccount()!;
    logger.debug("NewAccountCreateContactCardScreen", {
      address,
    });

    const { themed, theme } = useAppTheme();
    const { animation } = theme;

    const titleAnimation = animation
      .fadeInUpSpring()
      .delay(ONBOARDING_ENTERING_DELAY.FIRST)
      .duration(ONBOARDING_ENTERING_DURATION);

    const subtitleAnimation = animation
      .fadeInUpSpring()
      .delay(ONBOARDING_ENTERING_DELAY.SECOND)
      .duration(ONBOARDING_ENTERING_DURATION);

    const { isRandoAccount, setIsRandoAccount } = useSettingsStore(
      useSelect(["isRandoAccount", "setIsRandoAccount"])
    );

    const toggleType = useCallback(() => {
      setIsRandoAccount(!isRandoAccount);
    }, [isRandoAccount, setIsRandoAccount]);

    const { createOrUpdateProfile, loading, errorMessage } =
      useCreateOrUpdateProfileInfo();

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
          "[NewAccountCreateContactCardScreen] handleRandoContinue",
          randoDisplayName
        );
        const { success } = await createOrUpdateProfile({
          profile: {
            displayName: randoDisplayName,
            username: randomUsername,
          },
        });
        logger.debug(
          "[NewAccountCreateContactCardScreen] handleRandoContinue success",
          success
        );
        if (success) {
          navigation.popTo("Chats");
        }
      } catch (error) {
        captureErrorWithToast(error as Error);
      }
    }, [randoDisplayName, createOrUpdateProfile, navigation]);

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
          navigation.popTo("Chats");
        } else {
          throw new Error("Failed to create or update profile");
        }
      } catch (error) {
        captureErrorWithToast(error as Error);
      }
    }, [profile, asset?.uri, createOrUpdateProfile, navigation]);

    const handleContinue = useCallback(() => {
      logger.debug(
        "[NewAccountCreateContactCardScreen] handleContinue",
        isRandoAccount
      );
      if (isRandoAccount) {
        handleRandoContinue();
      } else {
        handleRealContinue();
      }
    }, [isRandoAccount, handleRealContinue, handleRandoContinue]);

    const isDoxxedAccount = !isRandoAccount;

    /**


        contactCard: {
      title: "Complete your contact card",
      subtitle: "A secure identity",
      body: "Add and edit Contact Cards anytime,",
      bodyPressable: "or go Rando for extra privacy.",
      randoTitle: "Go Rando",
      randoSubtitle: "Chat using random contact info",
      randoBody: "For everyday conversations,",
      randoPressable: "use your personal Contact Card.",
      import: "Import",
      name: "Name",
      namePlaceholder: "How you'll show up in chat",
      continue: "Continue",
    },


         */

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
                A secure identity
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
                  pfpUri={asset?.uri}
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
                {isDoxxedAccount
                  ? "Add and edit Contact Cards anytime,"
                  : "For everyday conversations,"}
              </AnimatedText>
              <Pressable onPress={toggleType}>
                <AnimatedText
                  style={$subtextPressableStyle}
                  color={"secondary"}
                >
                  {isDoxxedAccount
                    ? "or go Rando for extra privacy."
                    : "use your personal Contact Card."}
                </AnimatedText>
              </Pressable>
            </AnimatedVStack>
          </VStack>
        </Center>
        <OnboardingFooter
          text={"Continue"}
          iconName="chevron.right"
          onPress={handleContinue}
          disabled={loading || (isDoxxedAccount && !profile.displayName)}
        />
      </Screen>
    );
  }
);
