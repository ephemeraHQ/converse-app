import { RecommendationsType } from "../data/deprecatedStore/recommendationsReducer";
import { ProfileSocials } from "../data/store/profilesStore";
import { RecommendationData } from "./api";

export const getProfileData = (
  peerAddress: string,
  recommendations: RecommendationsType,
  socials: ProfileSocials | undefined
): RecommendationData | undefined => {
  // We get the data from the recommendations part
  const recos = recommendations?.frens?.[peerAddress];
  if (recos) return recos;
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
