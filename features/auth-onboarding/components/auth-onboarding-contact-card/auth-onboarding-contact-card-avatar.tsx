import React, { memo, useCallback, useEffect } from "react"
import { useAuthOnboardingStore } from "@/features/auth-onboarding/stores/auth-onboarding.store"
import { ProfileContactCardEditableAvatar } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-avatar"
import { useAddPfp } from "@/hooks/use-add-pfp"

export const AuthOnboardingContactCardAvatar = memo(function AuthOnboardingContactCardAvatar() {
  const { addPFP, asset, isUploading } = useAddPfp()

  const name = useAuthOnboardingStore((state) => state.name)
  const avatar = useAuthOnboardingStore((state) => state.avatar)

  // Update upload status in the store
  useEffect(() => {
    useAuthOnboardingStore.getState().actions.setIsAvatarUploading(isUploading)
  }, [isUploading])

  const addAvatar = useCallback(async () => {
    const url = await addPFP()
    if (url) {
      useAuthOnboardingStore.getState().actions.setAvatar(url)
    }
  }, [addPFP])

  return (
    <ProfileContactCardEditableAvatar
      avatarUri={avatar || asset?.uri}
      avatarName={name}
      onPress={addAvatar}
    />
  )
})
