import { memo, useCallback } from "react"
import { Snackbars } from "@/components/snackbar/snackbars"
import { ConnectWallet } from "@/features/wallets/connect-wallet/connect-wallet"
import { useAuthOnboardingStore } from "../stores/auth-onboarding.store"

export const AuthOnboardingContactCardImportInfoScreen = memo(
  function AuthOnboardingContactCardImportInfoScreen() {
    const handleSelectInfo = useCallback((info: { name: string; avatar: string | undefined }) => {
      if (info.avatar) {
        useAuthOnboardingStore.getState().actions.setAvatar(info.avatar)
      }
      useAuthOnboardingStore.getState().actions.setName(info.name)
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
