import { usePrivy } from "@privy-io/expo";
import { isAxiosError } from "axios";
import React, { memo, useCallback, useEffect, useState } from "react";
import { TextStyle, ViewStyle } from "react-native";
import {
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { z } from "zod";
import { create } from "zustand";
import { Screen } from "@/components/screen/screen";
import { showSnackbar } from "@/components/snackbar/snackbar.service";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { useAuthStore } from "@/features/authentication/authentication.store";
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store";
import { useCreateUser } from "@/features/current-user/use-create-user";
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { formatRandomUserName } from "@/features/onboarding/utils/format-random-user-name";
import { ProfileContactCardEditableAvatar } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-avatar";
import { ProfileContactCardEditableNameInput } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-name-input";
import { ProfileContactCardLayout } from "@/features/profiles/components/profile-contact-card/profile-contact-card-layout";
import { profileValidationSchema } from "@/features/profiles/schemas/profile-validation.schema";
import { validateProfileName } from "@/features/profiles/utils/validate-profile-name";
import { useAddPfp } from "@/hooks/use-add-pfp";
import { useHeader } from "@/navigation/use-header";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { ValidationError } from "@/utils/api/api.error";
import { captureErrorWithToast } from "@/utils/capture-error";

// Request validation schema
const createUserRequestSchema = z.object({
  inboxId: z.string(),
  privyUserId: z.string(),
  smartContractWalletAddress: z.string(),
  profile: profileValidationSchema.pick({ name: true, username: true, avatar: true }),
});

type IOnboardingContactCardStore = {
  name: string;
  username: string;
  nameValidationError: string;
  avatar: string;
  isAvatarUploading: boolean;
  actions: {
    setName: (name: string) => void;
    setUsername: (username: string) => void;
    setNameValidationError: (nameValidationError: string) => void;
    setAvatar: (avatar: string) => void;
    setIsAvatarUploading: (isUploading: boolean) => void;
    reset: () => void;
  };
};

const useOnboardingContactCardStore = create<IOnboardingContactCardStore>(
  (set) => ({
    name: "",
    username: "",
    nameValidationError: "",
    avatar: "",
    isAvatarUploading: false,
    actions: {
      setName: (name: string) => set({ name }),
      setUsername: (username: string) => set({ username }),
      setNameValidationError: (nameValidationError: string) =>
        set({ nameValidationError }),
      setAvatar: (avatar: string) => set({ avatar }),
      setIsAvatarUploading: (isAvatarUploading: boolean) =>
        set({ isAvatarUploading }),
      reset: () =>
        set({
          name: "",
          username: "",
          nameValidationError: "",
          avatar: "",
          isAvatarUploading: false,
        }),
    },
  }),
);

export function OnboardingContactCardScreen() {
  const { themed } = useAppTheme();

  const { mutateAsync: createUserAsync, isPending } = useCreateUser();

  const { user: privyUser } = usePrivy();

  const keyboard = useAnimatedKeyboard();

  const handleRealContinue = useCallback(async () => {
    try {
      const currentSender = useMultiInboxStore.getState().currentSender;
      const store = useOnboardingContactCardStore.getState();

      // Validate profile data first using profileValidationSchema
      const profileValidation = profileValidationSchema.safeParse({
        name: store.name,
        username: store.username,
        avatar: store.avatar,
      });

      if (!profileValidation.success) {
        const errorMessage =
          profileValidation.error.errors[0]?.message || "Invalid profile data";
        throw new ValidationError({ message: errorMessage });
      }

      if (!currentSender) {
        throw new Error("No current sender found, please logout");
      }

      if (!privyUser) {
        throw new Error("No Privy user found, please logout");
      }

      // Create and validate the request payload
      const payload = {
        inboxId: currentSender.inboxId,
        privyUserId: privyUser.id,
        smartContractWalletAddress: currentSender.ethereumAddress,
        profile: {
          name: store.name,
          username: store.username,
          avatar: store.avatar,
        },
      };

      // Validate the payload against our schema
      const validationResult = createUserRequestSchema.safeParse(payload);

      if (!validationResult.success) {
        throw new Error("Invalid request data. Please check your input.");
      }

      await createUserAsync(validationResult.data);
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
        showSnackbar({
          message: error.message,
          type: "error",
        });
      } else if (isAxiosError(error)) {
        const userMessage =
          error.response?.status === 409
            ? "This username is already taken"
            : "Failed to create profile. Please try again.";
        showSnackbar({
          message: userMessage,
          type: "error",
        });
      } else {
        captureErrorWithToast(error, {
          message: "An unexpected error occurred. Please try again.",
        });
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

  useEffect(() => {
    return () => {
      useOnboardingContactCardStore.getState().actions.reset();
    };
  }, []);

  const textContainerHeightAV = useSharedValue(0);
  const contentContainerHeightAV = useSharedValue(0);
  const cardContainerHeightAV = useSharedValue(0);
  const footerContainerHeightAV = useSharedValue(0);

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            keyboard.height.value,
            [0, 200],
            [
              0,
              -contentContainerHeightAV.value / 2 +
                cardContainerHeightAV.value / 2 +
                footerContainerHeightAV.value -
                textContainerHeightAV.value / 2,
            ],
            "clamp",
          ),
        },
      ],
      // opacity: interpolate(keyboard.height.value, [0, 200], [1, 0], "clamp"),
    };
  });

  const textContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(keyboard.height.value, [0, 200], [1, 0], "clamp"),
    };
  });

  // Get isAvatarUploading from the store
  const isAvatarUploading = useOnboardingContactCardStore(
    (state) => state.isAvatarUploading
  );

  return (
    <>
      <Screen
        contentContainerStyle={$screenContainer}
        safeAreaEdges={["bottom"]}
      >
        <AnimatedVStack
          // {...debugBorder()}
          style={[themed($contentContainer), contentAnimatedStyle]}
          onLayout={(event) => {
            contentContainerHeightAV.value = event.nativeEvent.layout.height;
          }}
        >
          <AnimatedVStack
            style={textContainerAnimatedStyle}
            // {...debugBorder()}
            onLayout={(event) => {
              textContainerHeightAV.value = event.nativeEvent.layout.height;
            }}
          >
            <OnboardingTitle size={"xl"}>
              Complete your contact card
            </OnboardingTitle>
            <OnboardingSubtitle style={themed($subtitleStyle)}>
              Choose how you show up
            </OnboardingSubtitle>
          </AnimatedVStack>

          <VStack
            onLayout={(event) => {
              cardContainerHeightAV.value = event.nativeEvent.layout.height;
            }}
          >
            <ProfileContactCardLayout
              name={<ProfileContactCardNameInput />}
              avatar={<ProfileContactCardAvatar />}
              // TODO: Import wallets
              // additionalOptions={<ProfileContactCardAdditionalOptions />}
            />
          </VStack>
        </AnimatedVStack>
        <VStack
          onLayout={(event) => {
            footerContainerHeightAV.value = event.nativeEvent.layout.height;
          }}
        >
          <OnboardingFooter
            text={"Continue"}
            iconName="chevron.right"
            onPress={handleRealContinue}
            isLoading={isPending || isAvatarUploading}
          />
        </VStack>
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

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  justifyContent: "center",
});

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
        useOnboardingContactCardStore.getState().actions.setUsername("");
        return;
      }

      setNameValidationError(undefined);
      const username = formatRandomUserName({ displayName: text });

      const store = useOnboardingContactCardStore.getState();
      store.actions.setName(text);
      store.actions.setUsername(username);
    }, []);

    return (
      <ProfileContactCardEditableNameInput
        defaultValue={useOnboardingContactCardStore.getState().name}
        onChangeText={handleDisplayNameChange}
        status={nameValidationError ? "error" : undefined}
        helper={nameValidationError}
      />
    );
  },
);

const ProfileContactCardAvatar = memo(function ProfileContactCardAvatar() {
  const { addPFP, asset, isUploading } = useAddPfp();

  const name = useOnboardingContactCardStore((state) => state.name);
  const avatar = useOnboardingContactCardStore((state) => state.avatar);

  // Update upload status in the store
  useEffect(() => {
    useOnboardingContactCardStore.getState().actions.setIsAvatarUploading(isUploading);
  }, [isUploading]);

  const addAvatar = useCallback(async () => {
    const url = await addPFP();
    if (url) {
      useOnboardingContactCardStore.getState().actions.setAvatar(url);
    }
  }, [addPFP]);

  return (
    <ProfileContactCardEditableAvatar
      avatarUri={avatar || asset?.uri}
      avatarName={name}
      onPress={addAvatar}
    />
  );
});
