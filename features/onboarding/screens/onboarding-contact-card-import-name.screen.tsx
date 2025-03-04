import { memo, useCallback } from "react"
import { Snackbars } from "@/components/snackbar/snackbars"
import { ConnectWallet } from "@/features/wallets/connect-wallet/connect-wallet"
import { useOnboardingContactCardStore } from "./onboarding-contact-card.store"

export const OnboardingContactCardImportNameScreen = memo(
  function OnboardingContactCardImportNameScreen() {
    const handleSelectName = useCallback((name: string) => {
      useOnboardingContactCardStore.getState().actions.setName(name)
    }, [])

    return (
      <>
        <ConnectWallet onSelectName={handleSelectName} />
        {/* Not sure why but if not here, they appear behind the screen? (formSheet problem?) */}
        <Snackbars />
      </>
    )
  },
)
