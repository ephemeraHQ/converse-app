import { useIsFocused } from "@react-navigation/native"
import React, { memo, useCallback, useState } from "react"
import { useAuthOnboardingStore } from "@/features/auth-onboarding/stores/auth-onboarding.store"
import { ProfileContactCardEditableNameInput } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-name-input"

export const AuthOnboardingContactCardNameInput = memo(
  function AuthOnboardingContactCardNameInput() {
    useIsFocused()

    const [nameValidationError, setNameValidationError] = useState<string>()

    const isOnchainName = useAuthOnboardingStore((state) => state.name?.includes("."))

    const handleDisplayNameChange = useCallback((args: { text: string; error?: string }) => {
      const { text, error } = args
      const { actions } = useAuthOnboardingStore.getState()

      if (error) {
        setNameValidationError(error)
        actions.setName("")
        return
      }

      setNameValidationError(undefined)
      actions.setName(text)
    }, [])

    return (
      <ProfileContactCardEditableNameInput
        defaultValue={useAuthOnboardingStore.getState().name}
        onChangeText={handleDisplayNameChange}
        status={nameValidationError ? "error" : undefined}
        helper={nameValidationError}
        isOnchainName={isOnchainName}
      />
    )
  },
)
