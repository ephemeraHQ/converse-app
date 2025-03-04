import { usePrivy } from "@privy-io/expo"
import { useIsFocused } from "@react-navigation/native"
import { isAxiosError } from "axios"
import React, { memo, useCallback, useEffect, useState } from "react"
import { ViewStyle } from "react-native"
import {
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { Screen } from "@/components/screen/screen"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { Text } from "@/design-system/Text"
import { AnimatedVStack, VStack } from "@/design-system/VStack"
import { useAuthStore } from "@/features/authentication/authentication.store"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { useCreateUser } from "@/features/current-user/use-create-user"
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer"
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle"
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title"
import { ProfileContactCardEditableAvatar } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-avatar"
import { ProfileContactCardEditableNameInput } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-name-input"
import { ProfileContactCardImportName } from "@/features/profiles/components/profile-contact-card/profile-contact-card-import-name"
import { ProfileContactCardLayout } from "@/features/profiles/components/profile-contact-card/profile-contact-card-layout"
import { useProfileContactCardStyles } from "@/features/profiles/components/profile-contact-card/use-profile-contact-card.styles"
import { useAddPfp } from "@/hooks/use-add-pfp"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { $globalStyles } from "@/theme/styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { getFirstZodValidationError, isZodValidationError } from "@/utils/zod"
import { useOnboardingContactCardStore } from "./onboarding-contact-card.store"

export function OnboardingContactCardScreen() {
  const { themed, theme } = useAppTheme()

  const { createUserAsync, isCreatingUser } = useCreateUser()

  const { user: privyUser } = usePrivy()

  const keyboard = useAnimatedKeyboard()

  const handleRealContinue = useCallback(async () => {
    try {
      const currentSender = useMultiInboxStore.getState().currentSender
      const store = useOnboardingContactCardStore.getState()

      if (!currentSender) {
        throw new Error("No current sender found, please logout")
      }

      if (!privyUser) {
        throw new Error("No Privy user found, please logout")
      }

      await createUserAsync({
        inboxId: currentSender.inboxId,
        privyUserId: privyUser.id,
        smartContractWalletAddress: currentSender.ethereumAddress,
        profile: {
          name: store.name,
          username: store.username,
          ...(store.avatar && { avatar: store.avatar }),
        },
      })

      useAuthStore.getState().actions.setStatus("signedIn")

      // TODO: Notification permissions screen
      // if (success) {
      //   if (needToShowNotificationsPermissions()) {
      //     router.push("OnboardingNotifications");
      //   } else {
      //     setAuthStatus(AuthStatuses.signedIn);
      //   }
      // }
    } catch (error) {
      if (isZodValidationError(error)) {
        showSnackbar({
          message: getFirstZodValidationError(error),
          type: "error",
        })
      } else if (isAxiosError(error)) {
        const userMessage =
          error.response?.status === 409
            ? "This username is already taken"
            : "Failed to create profile. Please try again."
        showSnackbar({
          message: userMessage,
          type: "error",
        })
      } else {
        captureErrorWithToast(error, {
          message: "An unexpected error occurred. Please try again.",
        })
      }
    }
  }, [createUserAsync, privyUser])

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
    leftText: "Cancel",
    onLeftPress: () => {
      useAuthStore.getState().actions.setStatus("signedOut")
    },
  })

  useEffect(() => {
    return () => {
      useOnboardingContactCardStore.getState().actions.reset()
    }
  }, [])

  const textContainerHeightAV = useSharedValue(0)
  const contentContainerHeightAV = useSharedValue(0)
  const cardContainerHeightAV = useSharedValue(0)
  const footerContainerHeightAV = useSharedValue(0)

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
    }
  })

  const textContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(keyboard.height.value, [0, 200], [1, 0], "clamp"),
    }
  })

  // Get isAvatarUploading from the store
  const isAvatarUploading = useOnboardingContactCardStore(
    (state) => state.isAvatarUploading,
  )
  const { container } = useProfileContactCardStyles()

  return (
    <>
      <Screen
        contentContainerStyle={$globalStyles.flex1}
        safeAreaEdges={["bottom"]}
      >
        <AnimatedVStack
          // {...debugBorder()}
          style={[
            themed($contentContainer),
            contentAnimatedStyle,
            {
              paddingHorizontal: theme.spacing.lg - container.margin,
              rowGap: theme.spacing.lg - container.margin,
            },
          ]}
          onLayout={(event) => {
            contentContainerHeightAV.value = event.nativeEvent.layout.height
          }}
        >
          <AnimatedVStack
            style={[
              textContainerAnimatedStyle,
              {
                rowGap: theme.spacing.sm,
              },
            ]}
            // {...debugBorder()}
            onLayout={(event) => {
              textContainerHeightAV.value = event.nativeEvent.layout.height
            }}
          >
            <OnboardingTitle size={"xl"}>
              Complete your{`\n`}contact card
            </OnboardingTitle>
            <OnboardingSubtitle>Choose how you show up</OnboardingSubtitle>
          </AnimatedVStack>

          <VStack
            onLayout={(event) => {
              cardContainerHeightAV.value = event.nativeEvent.layout.height
            }}
          >
            <ProfileContactCardLayout
              name={<ProfileContactCardNameInput />}
              avatar={<ProfileContactCardAvatar />}
              additionalOptions={<ProfileContactCardAdditionalOptions />}
            />
          </VStack>

          <Text
            preset="small"
            color="secondary"
            style={{
              textAlign: "center",
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            Add and edit Contact Cards anytime,{`\n`}or go Rando for extra
            privacy.
          </Text>
        </AnimatedVStack>
        <VStack
          onLayout={(event) => {
            footerContainerHeightAV.value = event.nativeEvent.layout.height
          }}
        >
          <OnboardingFooter
            text={"Continue"}
            iconName="chevron.right"
            onPress={handleRealContinue}
            isLoading={isCreatingUser || isAvatarUploading}
          />
        </VStack>
      </Screen>
    </>
  )
}

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  justifyContent: "center",
})

const ProfileContactCardNameInput = memo(
  function ProfileContactCardNameInput() {
    useIsFocused()

    const [nameValidationError, setNameValidationError] = useState<string>()

    const handleDisplayNameChange = useCallback(
      (args: { text: string; error?: string }) => {
        const { text, error } = args
        const { actions } = useOnboardingContactCardStore.getState()

        if (error) {
          setNameValidationError(error)
          actions.setName("")
          return
        }

        setNameValidationError(undefined)
        actions.setName(text)
      },
      [],
    )

    return (
      <ProfileContactCardEditableNameInput
        defaultValue={useOnboardingContactCardStore.getState().name}
        onChangeText={handleDisplayNameChange}
        status={nameValidationError ? "error" : undefined}
        helper={nameValidationError}
      />
    )
  },
)

const ProfileContactCardAvatar = memo(function ProfileContactCardAvatar() {
  const { addPFP, asset, isUploading } = useAddPfp()

  const name = useOnboardingContactCardStore((state) => state.name)
  const avatar = useOnboardingContactCardStore((state) => state.avatar)

  // Update upload status in the store
  useEffect(() => {
    useOnboardingContactCardStore
      .getState()
      .actions.setIsAvatarUploading(isUploading)
  }, [isUploading])

  const addAvatar = useCallback(async () => {
    const url = await addPFP()
    if (url) {
      useOnboardingContactCardStore.getState().actions.setAvatar(url)
    }
  }, [addPFP])

  return (
    <ProfileContactCardEditableAvatar
      avatarUri={avatar || asset?.uri}
      avatarName={name}
      onPress={addAvatar}
    />
  )
})

const ProfileContactCardAdditionalOptions = memo(
  function ProfileContactCardAdditionalOptions() {
    const router = useRouter()

    return (
      <ProfileContactCardImportName
        onPress={() => {
          router.navigate("OnboardingCreateContactCardImportName")
        }}
      />
    )
  },
)
