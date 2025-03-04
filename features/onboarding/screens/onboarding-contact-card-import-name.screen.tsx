import { memo, useCallback } from "react"
import { useOnboardingContactCardStore } from "@/features/onboarding/screens/onboarding-contact-card-screen"
import { ConnectWallet } from "@/features/wallets/connect-wallet/connect-wallet"

export const OnboardingContactCardImportNameScreen = memo(
  function OnboardingContactCardImportNameScreen() {
    const handleSelectName = useCallback((name: string) => {
      useOnboardingContactCardStore.getState().actions.setName(name)
    }, [])

    return <ConnectWallet onSelectName={handleSelectName} />
  },
)
