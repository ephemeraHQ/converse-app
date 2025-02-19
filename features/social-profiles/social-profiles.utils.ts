import {
  IEnsProfile,
  IFarcasterProfile,
  ILensProfile,
  IWeb3SocialProfile,
} from "./social-lookup.api";

export function isEnsProfile(
  profile: IWeb3SocialProfile
): profile is IEnsProfile {
  return profile.type === "ens";
}

export function isLensProfile(
  profile: IWeb3SocialProfile
): profile is ILensProfile {
  return profile.type === "lens";
}

export function isFarcasterProfile(
  profile: IWeb3SocialProfile
): profile is IFarcasterProfile {
  return profile.type === "farcaster";
}
