import { api } from "../../utils/api/api";
import { z } from "zod";

const ProfileType = z.enum([
  "ens",
  "farcaster",
  "basename",
  "lens",
  "unstoppable-domains",
]);

export type ProfileType = z.infer<typeof ProfileType>;

const SocialProfileSchema = z.object({
  type: ProfileType,
  address: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export type SocialProfile = z.infer<typeof SocialProfileSchema>;

const SocialProfilesResponseSchema = z.array(SocialProfileSchema);

/**
 * Fetches social profiles for a given address using the lookup endpoint
 */
export const getSocialProfilesForAddress = async (
  address: string
): Promise<SocialProfile[]> => {
  try {
    const { data } = await api.get(`/api/v1/lookup/address/${address}`);
    // Validate the response data against our schema
    return SocialProfilesResponseSchema.parse(data);
  } catch (error) {
    console.error(
      "[API SOCIAL-LOOKUP] Failed to fetch social profiles:",
      error
    );
    return [];
  }
};
