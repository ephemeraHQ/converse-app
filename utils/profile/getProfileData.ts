import { type IProfileSocials } from "@/features/profiles/profile-types";
import { RecommendationData } from "@data/store/recommendationsStore";

export const getProfileData = (
  recommendationData?: RecommendationData,
  socials?: IProfileSocials
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
