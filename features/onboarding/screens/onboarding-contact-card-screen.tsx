import { Screen } from "@/components/screen/screen";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import React, { memo, useCallback, useEffect, useState } from "react";

import { Center } from "@/design-system/Center";
import { VStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { captureErrorWithToast } from "@/utils/capture-error";
import { Alert, TextStyle, ViewStyle } from "react-native";
import { useAddPfp } from "../hooks/useAddPfp";
// import { useProfile } from "../hooks/useProfile";
import { useAuthStore } from "@/features/authentication/authentication.store";
import { useCreateUser } from "@/features/current-user/use-create-user";
import { useMultiInboxStore } from "@/features/multi-inbox/multi-inbox.store";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { ProfileContactCardEditableAvatar } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-avatar";
import { ProfileContactCardEditableNameInput } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-name-input";
import { ProfileContactCardLayout } from "@/features/profiles/components/profile-contact-card/profile-contact-card-layout";
import { validateProfileName } from "@/features/profiles/utils/validate-profile-name";
import { useHeader } from "@/navigation/use-header";
import { ValidationError } from "@/utils/api/api.error";
import { usePrivy } from "@privy-io/expo";
import { create } from "zustand";

export function OnboardingContactCardScreen() {
  const { themed } = useAppTheme();

  const { mutateAsync: createUserAsync, isPending } = useCreateUser();

  const { user: privyUser } = usePrivy();

  const handleRealContinue = useCallback(async () => {
    try {
      const currentSender = useMultiInboxStore.getState().currentSender;

      if (!currentSender) {
        throw new Error("No current sender found, please logout");
      }

      if (!privyUser) {
        throw new Error("No Privy user found, please logout");
      }

      await createUserAsync({
        inboxId: currentSender?.inboxId,
        privyUserId: privyUser?.id,
        smartContractWalletAddress: currentSender?.ethereumAddress,
        profile: {
          name: useOnboardingContactCardStore.getState().name,
        },
      });

      useAuthStore.getState().actions.setStatus("signedIn");

      // TODO: Notification permissions screen
      // if (success) {
      //   if (needToShowNotificationsPermissions()) {
      //     router.push("OnboardingNotifications");
      //   } else {
      //     setAuthStatus(AuthStatuses.signedIn);
      //   }
      // }
    } catch (error) {
      if (error instanceof ValidationError) {
        useOnboardingContactCardStore
          .getState()
          .actions.setNameValidationError(Object.values(error.errors)[0]);
        captureErrorWithToast(error, {
          message: Object.values(error.errors)[0],
        });
      } else {
        captureErrorWithToast(error);
      }
    }
  }, [createUserAsync, privyUser]);

  // const [
  //   isConnectWalletBottomSheetVisible,
  //   setIsConnectWalletBottomSheetVisible,
  // ] = useState(false);

  // const handleImportPress = useCallback(() => {
  //   alert("Working on this right now 🤙");
  //   // setIsConnectWalletBottomSheetVisible(true);
  // }, []);

  useHeader({
    safeAreaEdges: ["top"],
    leftText: "Logout",
    onLeftPress: () => {
      useAuthStore.getState().actions.setStatus("signedOut");
    },
  });

  return (
    <>
      <Screen
        preset="scroll"
        contentContainerStyle={$screenContainer}
        safeAreaEdges={["bottom"]}
      >
        <Center style={$centerContainerStyle}>
          <VStack style={$titleContainer}>
            <OnboardingTitle size={"xl"}>
              Complete your contact card
            </OnboardingTitle>
            <OnboardingSubtitle style={themed($subtitleStyle)}>
              Choose how you show up
            </OnboardingSubtitle>

            <ProfileContactCardLayout
              name={<ProfileContactCardNameInput />}
              avatar={<ProfileContactCardAvatar />}
              // TODO: Import wallets
              // additionalOptions={<ProfileContactCardAdditionalOptions />}
            />
          </VStack>
        </Center>
        <OnboardingFooter
          text={"Continue"}
          iconName="chevron.right"
          onPress={handleRealContinue}
          isLoading={isPending}
        />
      </Screen>

      {/* <ConnectWalletBottomSheet
        isVisible={isConnectWalletBottomSheetVisible}
        onClose={() => setIsConnectWalletBottomSheetVisible(false)}
        onWalletImported={(something) => {
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
      /> */}
    </>
  );
}

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

const ProfileContactCardNameInput = memo(
  function ProfileContactCardNameInput() {
    const [nameValidationError, setNameValidationError] = useState<string>();

    const handleDisplayNameChange = useCallback((text: string) => {
      const { isValid, error } = validateProfileName(text);

      if (!isValid) {
        setNameValidationError(error);
      } else {
        setNameValidationError(undefined);
      }

      useOnboardingContactCardStore.getState().actions.setName(text);
    }, []);

    return (
      <ProfileContactCardEditableNameInput
        defaultValue={useOnboardingContactCardStore.getState().name}
        onChangeText={handleDisplayNameChange}
        status={nameValidationError ? "error" : undefined}
        helper={nameValidationError}
      />
    );
  }
);

const ProfileContactCardAvatar = memo(function ProfileContactCardAvatar() {
  const { asset, addPFP } = useAddPfp();
  const onboardingStore = useOnboardingContactCardStore();

  useEffect(() => {
    if (asset?.uri && asset.uri !== onboardingStore.avatar) {
      onboardingStore.actions.setAvatar(asset.uri);
    }
  }, [asset?.uri, onboardingStore.actions, onboardingStore.avatar]);

  return (
    <ProfileContactCardEditableAvatar
      avatarUri={asset?.uri ?? onboardingStore.avatar}
      avatarName={onboardingStore.name}
      // onPress={addPFP}
      onPress={() => {
        Alert.alert("Coming soon");
      }}
    />
  );
});

type IOnboardingContactCardStore = {
  name: string;
  nameValidationError: string;
  avatar: string;
  actions: {
    setName: (name: string) => void;
    setNameValidationError: (nameValidationError: string) => void;
    setAvatar: (avatar: string) => void;
  };
};

const useOnboardingContactCardStore = create<IOnboardingContactCardStore>(
  (set, get) => ({
    name: "",
    nameValidationError: "",
    avatar: "",
    actions: {
      setName: (name: string) => set({ name }),
      setNameValidationError: (nameValidationError: string) =>
        set({ nameValidationError }),
      setAvatar: (avatar: string) => set({ avatar }),
    },
  })
);
