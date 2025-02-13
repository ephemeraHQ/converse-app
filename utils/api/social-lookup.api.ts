import { api } from "./api";
import { SocialProfile } from "thirdweb/react";

/**
 * Fetches social profiles for a given address using the lookup endpoint
 */
export const getSocialProfilesForAddress = async (
  address: string
): Promise<SocialProfile[]> => {
  try {
    const { data } = await api.get(`/api/v1/lookup/address/${address}`);
    return data;
  } catch (error) {
    console.error(
      "[API SOCIAL-LOOKUP] Failed to fetch social profiles:",
      error
    );
    return [];
  }
};
