import React, { memo } from "react"
import { ProfileContactCardImportName } from "@/features/profiles/components/profile-contact-card/profile-contact-card-import-name"
import { useRouter } from "@/navigation/use-navigation"

export const AuthOnboardingContactCardImport = memo(function AuthOnboardingContactCardImport() {
  const router = useRouter()

  return (
    <ProfileContactCardImportName
      onPress={() => {
        router.navigate("OnboardingCreateContactCardImportName")
      }}
    />
  )
})
