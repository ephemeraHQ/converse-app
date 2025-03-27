import { ISocialProfile } from "@/features/social-profiles/social-profiles.api"

export function doesSocialProfilesMatchTextQuery(args: {
  socialProfiles: ISocialProfile[]
  normalizedQuery: string
}) {
  const { socialProfiles, normalizedQuery } = args

  return socialProfiles.some((socialProfile) => {
    // Check base profile fields that are guaranteed to exist in the type
    const hasMatchInBaseFields = [
      socialProfile.name?.toLowerCase().includes(normalizedQuery),
      socialProfile.bio?.toLowerCase().includes(normalizedQuery),
    ].some(Boolean)

    return hasMatchInBaseFields
  })
}
