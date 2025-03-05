import { memo, useCallback } from "react"
import { Snackbars } from "@/components/snackbar/snackbars"
import { ConnectWallet } from "@/features/wallets/connect-wallet/connect-wallet"
import { useOnboardingContactCardStore } from "./onboarding-contact-card.store"

export const OnboardingContactCardImportInfoScreen = memo(
  function OnboardingContactCardImportInfoScreen() {
    const handleSelectInfo = useCallback((info: { name: string; avatar: string | undefined }) => {
      if (info.avatar) {
        useOnboardingContactCardStore.getState().actions.setAvatar(info.avatar)
      }
      useOnboardingContactCardStore.getState().actions.setName(info.name)
    }, [])

    return (
      <>
        <ConnectWallet onSelectInfo={handleSelectInfo} />
        {/* Not sure why but if not here, they appear behind the screen? (formSheet problem?) */}
        <Snackbars />
      </>
    )
  },
)
