import { memo, useEffect } from "react"
import { TextStyle, ViewStyle } from "react-native"
import { Screen } from "@/components/screen/screen"
import { AnimatedCenter, Center } from "@/design-system/Center"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { Link } from "@/design-system/link"
import { Pressable } from "@/design-system/Pressable"
import { AnimatedText, Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { ONBOARDING_ENTERING_DELAY } from "@/features/auth-onboarding/auth-onboarding.constants"
import { OnboardingSubtitle } from "@/features/auth-onboarding/components/onboarding-subtitle"
import { useAuthOnboardingContext } from "@/features/auth-onboarding/contexts/auth-onboarding.context"
import { useAuthOnboardingStore } from "@/features/auth-onboarding/stores/auth-onboarding.store"
import { useLogout } from "@/features/authentication/use-logout"
import { useHeader } from "@/navigation/use-header"
import { $globalStyles } from "@/theme/styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { openLink } from "@/utils/linking"
import { AuthOnboardingWelcomeFooter } from "./auth-onboarding-welcome-footer"

export const AuthOnboardingWelcome = memo(function AuthOnboardingWelcome() {
  const { themed, theme } = useAppTheme()

  const { logout } = useLogout()

  // Makes sense to make sure we're fully logged out when we are at this welcome screen
  useEffect(() => {
    logout({ caller: "AuthWelcomeContent onMount" }).catch(captureError)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useHeaderWrapper()

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

      <AuthOnboardingWelcomeFooter />

      <AnimatedCenter
        entering={theme.animation
          .reanimatedFadeInSpringSlow()
          .delay(ONBOARDING_ENTERING_DELAY.FIFTH)}
        style={themed($termsContainer)}
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

function useHeaderWrapper() {
  const { theme } = useAppTheme()

  const { login } = useAuthOnboardingContext()

  const isProcessingWeb3Stuff = useAuthOnboardingStore((s) => s.isProcessingWeb3Stuff)

  return useHeader(
    {
      safeAreaEdges: ["top"],
      RightActionComponent: (
        <AnimatedCenter
          entering={theme.animation
            .reanimatedFadeInSpringSlow()
            .delay(ONBOARDING_ENTERING_DELAY.SIXTH)}
        >
          <HeaderAction disabled={isProcessingWeb3Stuff} icon="person-badge-key" onPress={login} />
        </AnimatedCenter>
      ),
    },
    [isProcessingWeb3Stuff],
  )
}

const $termsContainer: ThemedStyle<ViewStyle> = ({ spacing, borderRadius, colors }) => ({
  padding: spacing.sm,
  margin: spacing.lg,
  backgroundColor: colors.background.raised,
  borderRadius: borderRadius.xxs,
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
