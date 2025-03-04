import { memo, useCallback } from "react"
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

  return <ConnectWallet onSelectName={handleSelectName} />
})
