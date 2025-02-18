import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import { z } from "zod";

// Define the profile type enum to match backend
const ProfileType = z.enum([
  "ens",
  "farcaster",
  "basename",
  "lens",
  "unstoppable-domains",
]);

// Simplified schema to match backend response
const SocialProfileSchema = z.object({
  type: ProfileType,
  address: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export type ISocialProfile = z.infer<typeof SocialProfileSchema>;

const SocialProfilesResponseSchema = z.object({
  socialProfiles: z.array(SocialProfileSchema),
});

export type ISocialProfilesResponse = z.infer<
  typeof SocialProfilesResponseSchema
>;

export async function fetchSocialProfilesForAddress(args: { address: string }) {
  const { address } = args;

  const { data } = await api.get<ISocialProfilesResponse>(
    `/api/v1/lookup/address/${address}`
  );

  const response = SocialProfilesResponseSchema.safeParse(data);

  if (!response.success) {
    captureError(
      new Error(
        `Invalid social profiles response: ${JSON.stringify(response.error)}`
      )
    );
  }

  return response.data;
}
