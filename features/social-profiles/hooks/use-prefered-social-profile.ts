import { ISocialProfile } from "../social-profiles.api"

export function usePreferredSocialProfile(args: { socialProfiles: ISocialProfile[] }) {
  const { socialProfiles } = args

  // For now just return the first one we have but later the users will have a preferences
  return socialProfiles[0]
}
