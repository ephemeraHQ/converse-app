import type {
  IBasenameProfile,
  IEnsProfile,
  IFarcasterProfile,
  ILensProfile,
  ISocialProfile,
  IUnstoppableDomainsProfile,
} from "./social-profiles.api"

export function isEnsProfile(profile: ISocialProfile): profile is IEnsProfile {
  return profile.type === "ens"
}

export function isLensProfile(profile: ISocialProfile): profile is ILensProfile {
  return profile.type === "lens"
}

export function isFarcasterProfile(profile: ISocialProfile): profile is IFarcasterProfile {
  return profile.type === "farcaster"
}

export function isUnstoppableDomainsProfile(
  profile: ISocialProfile,
): profile is IUnstoppableDomainsProfile {
  return profile.type === "unstoppable-domains"
}

export function isBasenameProfile(profile: ISocialProfile): profile is IBasenameProfile {
  return profile.type === "basename"
}
