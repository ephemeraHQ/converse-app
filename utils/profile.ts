import { getCleanAddress } from "./eth";
import { shortAddress } from "./str";
import { ProfileByAddress, ProfileSocials } from "../data/store/profilesStore";
import { RecommendationData } from "../data/store/recommendationsStore";

export const getProfileData = (
  recommendationData?: RecommendationData,
  socials?: ProfileSocials
): RecommendationData | undefined => {
  // We get the data from the recommendations part
  if (recommendationData) return recommendationData;
  // If not we get it from the profile part
  if (!socials) return undefined;

  return {
    tags: [],
    profile: socials,
  };
};

export function getPreferredName(
  socials: ProfileSocials | undefined,
  peerAddress: string
): string {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;
  const unsDomain =
    socials?.unstoppableDomains?.find((d) => d.isPrimary) || null;

  if (userName) {
    return userName.displayName || userName.name;
  } else if (ensName) {
    return ensName.displayName || ensName.name;
  } else if (unsDomain) {
    return unsDomain.domain;
  }

  return shortAddress(peerAddress);
}

export function getPreferredUsername(
  socials: ProfileSocials | undefined
): string | undefined {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;
  const unsDomain =
    socials?.unstoppableDomains?.find((d) => d.isPrimary) || null;

  if (userName) {
    return userName.name;
  } else if (ensName) {
    return ensName.name;
  } else if (unsDomain) {
    return unsDomain.domain;
  }
}

export function getPreferredAvatar(
  socials: ProfileSocials | undefined
): string | undefined {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;

  if (userName) {
    return userName.avatar;
  } else if (ensName) {
    return ensName.avatar;
  }
}

export function getPrimaryNames(socials: ProfileSocials | undefined): string[] {
  if (!socials) {
    return [];
  }

  const primaryNames: string[] = [];
  if (socials.userNames) {
    primaryNames.push(
      ...socials.userNames.filter((u) => u.isPrimary).map((u) => u.name)
    );
  }
  if (socials.ensNames) {
    primaryNames.push(
      ...socials.ensNames.filter((e) => e.isPrimary).map((e) => e.name)
    );
  }
  if (socials.unstoppableDomains) {
    primaryNames.push(
      ...socials.unstoppableDomains
        .filter((d) => d.isPrimary)
        .map((d) => d.domain)
    );
  }
  if (socials.farcasterUsernames) {
    primaryNames.push(
      ...socials.farcasterUsernames
        .filter((f) => f.username)
        .map((f) => `${f.username} on farcaster`)
    );
  }
  if (socials.lensHandles) {
    primaryNames.push(
      ...socials.lensHandles
        .filter((l) => l.handle)
        .map((l) => `${l.handle} on lens`)
    );
  }

  return primaryNames;
}

export const getProfile = (
  address: string | undefined,
  profilesByAddress: ProfileByAddress | undefined
) => {
  // We might have stored values in lowercase or formatted, let's check both
  if (!profilesByAddress || !address) return undefined;
  return (
    profilesByAddress[address] ||
    profilesByAddress[getCleanAddress(address)] ||
    profilesByAddress[address.toLowerCase()]
  );
};
