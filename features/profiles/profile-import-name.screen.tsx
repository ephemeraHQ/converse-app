import { memo, useCallback } from "react"
import { Snackbars } from "@/components/snackbar/snackbars"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useProfileMeStore } from "@/features/profiles/profile-me.store"
import { ConnectWallet } from "@/features/wallets/connect-wallet/connect-wallet"

export const ProfileImportNameScreen = memo(function ProfileImportNameScreen() {
  const currentSender = useSafeCurrentSender()

  const profileMeStore = useProfileMeStore(currentSender.inboxId)

  const handleSelectName = useCallback(
    (name: string) => {
      profileMeStore.getState().actions.setNameTextValue(name)
    },
    [profileMeStore],
  )

  return (
    <>
      <ConnectWallet onSelectName={handleSelectName} />
      {/* Not sure why but if not here, they appear behind the screen? (formSheet problem?) */}
      <Snackbars />
    </>
  )
})
