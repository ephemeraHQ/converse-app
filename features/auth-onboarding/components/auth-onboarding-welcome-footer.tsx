import { memo } from "react"
import { AnimatedVStack } from "@/design-system/VStack"
import { ONBOARDING_ENTERING_DELAY } from "@/features/auth-onboarding/auth-onboarding.constants"
import { OnboardingFooter } from "@/features/auth-onboarding/components/onboarding-footer"
import { useAuthOnboardingContext } from "@/features/auth-onboarding/contexts/auth-onboarding.context"
import { useAuthOnboardingStore } from "@/features/auth-onboarding/stores/auth-onboarding.store"
import { useAppTheme } from "@/theme/use-app-theme"

export const AuthOnboardingWelcomeFooter = memo(function AuthOnboardingWelcomeFooter() {
  const { theme } = useAppTheme()
  const { signup } = useAuthOnboardingContext()

  const isProcessingWeb3Stuff = useAuthOnboardingStore((s) => s.isProcessingWeb3Stuff)

  return (
    <AnimatedVStack
      entering={theme.animation
        .reanimatedFadeInSpringSlow()
        .delay(ONBOARDING_ENTERING_DELAY.FOURTH)}
    >
      <OnboardingFooter
        iconName="contact-card"
        text="Create a Contact Card"
        onPress={signup}
        disabled={isProcessingWeb3Stuff}
        iconButtonProps={{
          iconSize: 34, // Custom size to fit the Figma design
        }}
      />
    </AnimatedVStack>
  )
})
