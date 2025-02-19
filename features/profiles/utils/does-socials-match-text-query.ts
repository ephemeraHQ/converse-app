import { IWeb3SocialProfile } from "@/features/social-profiles/social-lookup.api";
import {
  isEnsProfile,
  isFarcasterProfile,
  isLensProfile,
} from "@/features/social-profiles/social-profiles.utils";

export function doesWeb3SocialsMatchTextQuery(args: {
  web3SocialProfiles: IWeb3SocialProfile[];
  normalizedQuery: string;
}) {
  const { web3SocialProfiles, normalizedQuery } = args;

  return web3SocialProfiles.some((web3SocialProfile) => {
    // Check base profile fields
    const hasMatchInBaseFields = [
      web3SocialProfile.name?.toLowerCase().includes(normalizedQuery),
      web3SocialProfile.bio?.toLowerCase().includes(normalizedQuery),
    ].some(Boolean);

    if (hasMatchInBaseFields) {
      return true;
    }

    // Check metadata based on profile type
    if (!web3SocialProfile.metadata) {
      return false;
    }

    if (isEnsProfile(web3SocialProfile)) {
      return web3SocialProfile.metadata.name
        ?.toLowerCase()
        .includes(normalizedQuery);
    }

    if (isLensProfile(web3SocialProfile)) {
      return web3SocialProfile.metadata.name
        ?.toLowerCase()
        .includes(normalizedQuery);
    }

    if (isFarcasterProfile(web3SocialProfile)) {
      return [
        web3SocialProfile.metadata.username
          ?.toLowerCase()
          .includes(normalizedQuery),
        web3SocialProfile.metadata.display
          ?.toLowerCase()
          .includes(normalizedQuery),
      ].some(Boolean);
    }

    return false;
  });
}
