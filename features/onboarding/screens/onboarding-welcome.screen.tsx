import { usePrivy } from "@privy-io/expo"
import { reloadAppAsync } from "expo"
import { memo, useCallback, useEffect, useState } from "react"
import { TextStyle } from "react-native"
import { Screen } from "@/components/screen/screen"
import { AnimatedCenter, Center } from "@/design-system/Center"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { Link } from "@/design-system/link"
import { Pressable } from "@/design-system/Pressable"
import { AnimatedText, Text } from "@/design-system/Text"
import { AnimatedVStack, VStack } from "@/design-system/VStack"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { useLogout } from "@/features/authentication/use-logout"
import { OnboardingFooter } from "@/features/onboarding/components/onboarding-footer"
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle"
import { useLoginWithPasskey } from "@/features/onboarding/hooks/use-login-with-passkey"
import { useSignupWithPasskey } from "@/features/onboarding/hooks/use-signup-with-passkey"
import { ONBOARDING_ENTERING_DELAY } from "@/features/onboarding/onboarding.constants"
import { OnboardingContactCardScreen } from "@/features/onboarding/screens/onboarding-contact-card.screen"
import { useHeader } from "@/navigation/use-header"
import { $globalStyles } from "@/theme/styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { ensureError } from "@/utils/error"
import { openLink } from "@/utils/linking"

export const OnboardingWelcomeScreen = memo(function OnboardingWelcomeScreen() {
  const { themed, theme } = useAppTheme()

  const { logout } = useLogout()

  const { signup, isSigningUp } = useSignupWithPasskey()
  const { login, isLoggingIn } = useLoginWithPasskey()

  const { user } = usePrivy()

  // Safer to fully logout when we're here
  useEffect(() => {
    logout({ caller: "OnboardingWelcomeScreen onMount" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignup = useCallback(async () => {
    try {
      // If the user decides to sign up again, make sure we're fully logged out
      // await logout({ caller: "OnboardingWelcomeScreen handleSignup" })

      // const { inboxId, ethereumAddress } =
      await signup()

      // useMultiInboxStore.getState().actions.setCurrentSender({
      //   ethereumAddress,
      //   inboxId,
      // })
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
  }, [signup])

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

  useHeader({
    safeAreaEdges: ["top"],
    RightActionComponent: (
      <AnimatedCenter
        entering={theme.animation
          .reanimatedFadeInSpringSlow()
          .delay(ONBOARDING_ENTERING_DELAY.SIXTH)}
      >
        <HeaderAction icon="person-badge-key" onPress={handleLogin} />
      </AnimatedCenter>
    ),
  })

  if (user) {
    return <OnboardingContactCardScreen />
  }

  return (
    <Screen contentContainerStyle={$globalStyles.flex1} safeAreaEdges={["bottom"]} preset="fixed">
      <Center style={$globalStyles.flex1}>
        <VStack>
          <OnboardingSubtitle
            entering={theme.animation
              .reanimatedFadeInSpringSlow()
              .delay(ONBOARDING_ENTERING_DELAY.FIRST)}
          >
            Welcome to Convos
          </OnboardingSubtitle>
          {/* This is a really custom text. No preset */}
          <AnimatedText
            entering={theme.animation
              .reanimatedFadeInSpringSlow()
              .delay(ONBOARDING_ENTERING_DELAY.SECOND)}
            style={themed($titleStyle)}
          >
            Not another{"\n"}chat app
          </AnimatedText>
          <AnimatedText
            entering={theme.animation
              .reanimatedFadeInSpringSlow()
              .delay(ONBOARDING_ENTERING_DELAY.THIRD)}
            style={$subtextStyle}
            color={"secondary"}
          >
            Super secure · Decentralized · Universal
          </AnimatedText>
        </VStack>
      </Center>

      <AnimatedVStack
        entering={theme.animation
          .reanimatedFadeInSpringSlow()
          .delay(ONBOARDING_ENTERING_DELAY.FOURTH)}
      >
        <OnboardingFooter
          iconName="contact-card"
          text="Create a Contact Card"
          onPress={handleSignup}
          disabled={isSigningUp || isLoggingIn}
          isLoading={isSigningUp || isLoggingIn}
          iconButtonProps={{
            iconSize: 34, // Custom size to fit the Figma design
          }}
        />
      </AnimatedVStack>

      <AnimatedCenter
        entering={theme.animation
          .reanimatedFadeInSpringSlow()
          .delay(ONBOARDING_ENTERING_DELAY.FIFTH)}
        style={{
          padding: theme.spacing.sm,
          margin: theme.spacing.lg,
          backgroundColor: "#F5F2EC",
          borderRadius: theme.borderRadius.xxs,
        }}
      >
        <Pressable>
          <Text
            preset="smaller"
            color="secondary"
            style={{
              textAlign: "center",
            }}
          >
            When you create a contact card, you agree{"\n"}to the Convos{" "}
            <Link
              preset="smaller"
              color="secondary"
              onPress={() => openLink({ url: "https://www.convos.xyz/terms" })}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              preset="smaller"
              color="secondary"
              onPress={() => openLink({ url: "https://www.convos.xyz/privacy" })}
            >
              Privacy Policy
            </Link>
          </Text>
        </Pressable>
      </AnimatedCenter>
    </Screen>
  )
})

const $subtextStyle: TextStyle = {
  textAlign: "center",
}

const $titleStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 56,
  lineHeight: 56,
  textAlign: "center",
  fontWeight: "bold",
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
})
