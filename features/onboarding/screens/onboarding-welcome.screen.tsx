import { memo, useCallback, useEffect } from "react"
import { TextStyle } from "react-native"
import { Screen } from "@/components/screen/screen"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { Center } from "@/design-system/Center"
import { Pressable } from "@/design-system/Pressable"
import { AnimatedText, Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { useLogout } from "@/features/authentication/use-logout"
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer"
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle"
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title"
import { useLoginWithPasskey } from "@/features/onboarding/hooks/use-login-with-passkey"
import { useSignupWithPasskey } from "@/features/onboarding/hooks/use-signup-with-passkey"
import { useHeader } from "@/navigation/use-header"
import { $globalStyles } from "@/theme/styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { ensureError } from "@/utils/error"

export const OnboardingWelcomeScreen = memo(function OnboardingWelcomeScreen() {
  const { themed, theme } = useAppTheme()

  const { logout } = useLogout()

  const { signup, isSigningUp } = useSignupWithPasskey()
  const { login, isLoggingIn } = useLoginWithPasskey()

  // Safer to fully logout when we're here
  useEffect(() => {
    logout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignup = useCallback(async () => {
    try {
      // If the user decides to sign up again, make sure we're fully logged out
      await logout()

      const { inboxId, ethereumAddress } = await signup()
      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress,
        inboxId,
      })
    } catch (error) {
      const typedError = ensureError(error)
      // Don't show toast for passkey cancellation
      if (
        typedError.message.includes("AuthenticationServices.AuthorizationError error 1001") ||
        typedError.message.includes("UserCancelled")
      ) {
        return
      } else if (typedError.message.includes("Biometrics must be enabled")) {
        captureErrorWithToast(error, {
          message: "Biometrics must be enabled",
        })
      } else {
        captureErrorWithToast(error, {
          message: typedError.message || "Error signing up with passkey",
        })
      }
    }
  }, [signup, logout])

  const handleLogin = useCallback(async () => {
    try {
      const { inboxId, ethereumAddress } = await login()
      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress,
        inboxId,
      })
    } catch (error) {
      const typedError = ensureError(error)
      // Don't show toast for passkey cancellation
      if (
        typedError.message.includes("AuthenticationServices.AuthorizationError error 1001") ||
        typedError.message.includes("UserCancelled")
      ) {
        return
      } else {
        captureErrorWithToast(error, {
          message: typedError.message || "Error signing in with passkey",
        })
      }
    }
  }, [login])

  const handleReset = useCallback(async () => {
    try {
      await logout()
      showSnackbar({
        message: "State reset. You can now sign in again",
      })
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error resetting state. Please close the app and try again",
      })
    }
  }, [logout])

  useHeader({
    safeAreaEdges: ["top"],
    rightText: "Login",
    onRightPress: handleLogin,
  })

  return (
    <>
      <Screen
        contentContainerStyle={$globalStyles.flex1}
        safeAreaEdges={["bottom"]}
        preset="scroll"
      >
        <Center style={$globalStyles.flex1}>
          <VStack>
            <OnboardingSubtitle>Welcome to Convos</OnboardingSubtitle>
            <OnboardingTitle style={themed($titleStyle)}>Not another{"\n"}chat app</OnboardingTitle>
            <AnimatedText style={$subtextStyle} color={"secondary"}>
              Super secure · Decentralized · Universal
            </AnimatedText>
          </VStack>
        </Center>

        <OnboardingFooter
          iconName="biometric"
          text="Create a Contact Card"
          onPress={handleSignup}
          disabled={isSigningUp || isLoggingIn}
          isLoading={isSigningUp}
        />

        <Center
          style={{
            paddingHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.lg,
          }}
        >
          <Pressable onPress={handleReset}>
            <Text
              preset="smaller"
              color="secondary"
              style={{
                textAlign: "center",
              }}
            >
              Press me to clear stuff and restart{"\n"}(use this if you get in a funky state)
            </Text>
          </Pressable>
        </Center>
      </Screen>
    </>
  )
})

const $subtextStyle: TextStyle = {
  textAlign: "center",
}

const $titleStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
})
