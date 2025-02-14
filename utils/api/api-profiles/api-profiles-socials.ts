import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { api } from "@/utils/api/api";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import { ApiError } from "@/utils/error";
import { z } from "zod";

const FarcasterProfileSchema = z.object({
  fid: z.number().optional(),
  bio: z.string().optional(),
  pfp: z.string().optional(),
  display: z.string().optional(),
  username: z.string().optional(),
  custodyAddress: z.string().optional(),
  addresses: z.array(z.string()).optional(),
});

const LensProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  picture: z.string().optional(),
  coverPicture: z.string().optional(),
});

const EnsProfileSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  display: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  email: z.string().optional(),
  mail: z.string().optional(),
  notice: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  url: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  discord: z.string().optional(),
  telegram: z.string().optional(),
});

const SocialProfileSchema = z.object({
  type: z.enum(["farcaster", "lens", "ens"]),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  metadata: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("farcaster"),
        ...FarcasterProfileSchema.shape,
      }),
      z.object({ type: z.literal("lens"), ...LensProfileSchema.shape }),
      z.object({ type: z.literal("ens"), ...EnsProfileSchema.shape }),
    ])
    .optional(),
});

const ProfileSocialsResponseSchema = z.object({
  socialProfiles: z.array(SocialProfileSchema),
});

export type ISocialProfile = z.infer<typeof SocialProfileSchema>;

export async function getProfileSocialsForCurrentAccount({
  ethAddress,
}: {
  ethAddress: string;
}) {
  const currentAccount = getCurrentAccount()!;

  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { ethAddress },
    });

    const parseResult = ProfileSocialsResponseSchema.safeParse(data);

    if (!parseResult.success) {
      throw new ApiError(
        `[API PROFILES] getProfileSocialsForCurrentAccount parse error for ethAddress: ${ethAddress}`,
        parseResult.error
      );
    }

    return parseResult.data.socialProfiles;
  } catch (error) {
    throw new ApiError(
      `[API PROFILES] getProfileSocialsForCurrentAccount failed for ethAddress: ${ethAddress}`,
      error
    );
  }
}
