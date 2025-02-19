import { api } from "@/utils/api/api";
import { z } from "zod";
import { logger } from "@/utils/logger";
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
  logger.debug(
    `[fetchSocialProfilesForAddress] Fetching social profiles for address: ${address}`
  );
  const { data } = await api.get(`/api/v1/lookup/address/${address}`);
  const parsedData = SocialProfilesResponseSchema.parse(data);
  logger.debug(
    `[fetchSocialProfilesForAddress] Successfully fetched ${parsedData.length} social profiles for address: ${address}`
  );
  return parsedData;
};
