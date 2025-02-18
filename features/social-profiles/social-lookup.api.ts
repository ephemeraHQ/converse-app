import { api } from "@/utils/api/api";
import { z } from "zod";

const Web3SocialProfileType = z.enum([
  "ens",
  "farcaster",
  "basename",
  "lens",
  "unstoppable-domains",
]);

export type IWeb3SocialProfileType = z.infer<typeof Web3SocialProfileType>;

const Web3SocialProfileSchema = z.object({
  type: Web3SocialProfileType,
  address: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export type IWeb3SocialProfile = z.infer<typeof Web3SocialProfileSchema>;

const SocialProfilesResponseSchema = z.array(Web3SocialProfileSchema);

/**
 * Fetches social profiles for a given address using the lookup endpoint
 */
export const fetchSocialProfilesForAddress = async (
  address: string
): Promise<IWeb3SocialProfile[]> => {
  try {
    const { data } = await api.get(`/api/v1/lookup/address/${address}`);
    return SocialProfilesResponseSchema.parse(data);
  } catch (error) {
    console.error(
      "[API SOCIAL-LOOKUP] Failed to fetch social profiles:",
      error
    );
    return [];
  }
};
