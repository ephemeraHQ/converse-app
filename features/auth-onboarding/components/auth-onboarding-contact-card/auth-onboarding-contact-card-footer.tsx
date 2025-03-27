import { usePrivy } from "@privy-io/expo"
import { isAxiosError } from "axios"
import React, { memo, useCallback, useState } from "react"
import { SharedValue } from "react-native-reanimated"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { VStack } from "@/design-system/VStack"
import { OnboardingFooter } from "@/features/auth-onboarding/components/onboarding-footer"
import { useAuthOnboardingStore } from "@/features/auth-onboarding/stores/auth-onboarding.store"
import { hydrateAuth } from "@/features/authentication/hydrate-auth"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { useCreateUserMutation } from "@/features/current-user/use-create-user"
import { captureErrorWithToast } from "@/utils/capture-error"
import { waitUntilPromise } from "@/utils/wait-until-promise"
import { getFirstZodValidationError, isZodValidationError } from "@/utils/zod"

export const AuthOnboardingContactCardFooter = memo(function AuthOnboardingContactCardFooter({
  footerContainerHeightAV,
}: {
  footerContainerHeightAV: SharedValue<number>
}) {
  const { mutateAsync: createUserAsync, isPending: isCreatingUser } = useCreateUserMutation()

  const isAvatarUploading = useAuthOnboardingStore((state) => state.isAvatarUploading)
  const isProcessingWeb3Stuff = useAuthOnboardingStore((s) => s.isProcessingWeb3Stuff)

  const [pressedOnContinue, setPressedOnContinue] = useState(false)

  const { user: privyUser } = usePrivy()

  const handleRealContinue = useCallback(async () => {
    try {
      setPressedOnContinue(true)

      // Wait until we finished processing web3 stuff
      await waitUntilPromise({
        checkFn: () => !useAuthOnboardingStore.getState().isProcessingWeb3Stuff,
      })

      const currentSender = useMultiInboxStore.getState().currentSender
      const store = useAuthOnboardingStore.getState()

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

      await hydrateAuth()
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
    } finally {
      setPressedOnContinue(false)
    }
  }, [createUserAsync, privyUser])

  return (
    <VStack
      onLayout={(event) => {
        footerContainerHeightAV.value = event.nativeEvent.layout.height
      }}
    >
      <OnboardingFooter
        text={"Continue"}
        iconName="chevron.right"
        onPress={handleRealContinue}
        isLoading={
          isCreatingUser ||
          isAvatarUploading ||
          // Show loading if user pressed on continue but we're still creating their web3 stuff in the background
          (pressedOnContinue && isProcessingWeb3Stuff)
        }
      />
    </VStack>
  )
})
