import { getProfileData } from "../getProfileData";
import { type ProfileSocials } from "@data/store/profilesStore";
import { type RecommendationData } from "@data/store/recommendationsStore";

describe("getProfileData", () => {
  const mockSocials: ProfileSocials = {
    userNames: [
      {
        name: "test.cb.id",
        isPrimary: true,
      },
    ],
  };

  const mockRecommendationData: RecommendationData = {
    tags: [
      { text: "tag1", image: "" },
      { text: "tag2", image: "" },
    ],
    profile: mockSocials,
  };

  it("should return recommendation data when provided", () => {
    const result = getProfileData(mockRecommendationData, mockSocials);
    expect(result).toBe(mockRecommendationData);
  });

  it("should return undefined when no recommendation data and no socials", () => {
    const result = getProfileData(undefined, undefined);
    expect(result).toBeUndefined();
  });

  it("should return profile data when only socials provided", () => {
    const result = getProfileData(undefined, mockSocials);
    expect(result).toEqual({
      tags: [],
      profile: mockSocials,
    });
  });
});
