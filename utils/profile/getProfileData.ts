import { type ProfileSocials } from "@data/store/profilesStore";
import { RecommendationData } from "@data/store/recommendationsStore";

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
