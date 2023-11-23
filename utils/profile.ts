import { ProfileSocials } from "../data/store/profilesStore";
import { RecommendationData } from "../data/store/recommendationsStore";
import { shortAddress } from "./str";

export const getProfileData = (
  recommendationData?: RecommendationData,
  socials?: ProfileSocials
): RecommendationData | undefined => {
  // We get the data from the recommendations part
  if (recommendationData) return recommendationData;
  // If not we get it from the profile part
  if (!socials) return undefined;
  const ens = socials.ensNames?.find((e) => e.isPrimary)?.name;
  const farcasterUsernames =
    socials.farcasterUsernames?.map((f) => f.username) || [];
  const lensHandles = socials.lensHandles?.map((l) => l.handle) || [];
  if (!ens && farcasterUsernames.length === 0 && lensHandles.length === 0)
    return undefined;
  return {
    tags: [],
    ens,
    farcasterUsernames,
    lensHandles,
  };
};

export function getPreferredName(options: {
  lensHandle?: string | null;
  userName?: string | null;
  ensName?: string | null;
  unsDomain?: string | null;
  peerAddress: string;
  preferLensHandle?: boolean;
}): string {
  const {
    lensHandle,
    userName,
    ensName,
    unsDomain,
    peerAddress,
    preferLensHandle = false,
  } = options;

  if (preferLensHandle && lensHandle) {
    return lensHandle;
  }

  return userName || ensName || unsDomain || shortAddress(peerAddress);
}
