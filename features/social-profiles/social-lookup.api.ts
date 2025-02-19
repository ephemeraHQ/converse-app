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

export type ISocialProfile = z.infer<typeof SocialProfileSchema>;
const Web3SocialProfileSchema = z.object({
  type: z.enum(["farcaster", "lens", "ens"]),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  metadata: z
    .union([FarcasterProfileSchema, LensProfileSchema, EnsProfileSchema])
    .optional(),
});

export type IFarcasterProfile = IWeb3SocialProfile & {
  type: "farcaster";
  metadata: z.infer<typeof FarcasterProfileSchema>;
};

export type ILensProfile = IWeb3SocialProfile & {
  type: "lens";
  metadata: z.infer<typeof LensProfileSchema>;
};

export type IEnsProfile = IWeb3SocialProfile & {
  type: "ens";
  metadata: z.infer<typeof EnsProfileSchema>;
};

export type IWeb3SocialProfile = z.infer<typeof Web3SocialProfileSchema>;

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
