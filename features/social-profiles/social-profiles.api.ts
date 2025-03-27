import { z } from "zod"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { IEthereumAddress } from "@/utils/evm/address"

// Define the profile type enum to match backend
const ProfileType = z.enum(["ens", "farcaster", "basename", "lens", "unstoppable-domains"])

export type ISocialProfileType = z.infer<typeof ProfileType>

// Define the base social profile schema to match backend
// Base schema for common social profile fields
const BaseSocialProfileSchema = z.object({
  address: z.custom<IEthereumAddress>(),
  name: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
})

// Generic social profile that can have any profile type
const SocialProfileSchema = BaseSocialProfileSchema.extend({
  type: ProfileType,
})

// ENS-specific profile schema
export const EnsProfileSchema = BaseSocialProfileSchema.extend({
  type: z.literal("ens"),
})

// Farcaster-specific profile schema
export const FarcasterProfileSchema = BaseSocialProfileSchema.extend({
  type: z.literal("farcaster"),
})

// Lens-specific profile schema
export const LensProfileSchema = BaseSocialProfileSchema.extend({
  type: z.literal("lens"),
})

// Unstoppable Domains-specific profile schema
export const UnstoppableDomainsProfileSchema = BaseSocialProfileSchema.extend({
  type: z.literal("unstoppable-domains"),
})

export const BasenameProfileSchema = BaseSocialProfileSchema.extend({
  type: z.literal("basename"),
})

export type IEnsProfile = z.infer<typeof EnsProfileSchema>
export type IFarcasterProfile = z.infer<typeof FarcasterProfileSchema>
export type ILensProfile = z.infer<typeof LensProfileSchema>
export type IUnstoppableDomainsProfile = z.infer<typeof UnstoppableDomainsProfileSchema>
export type IBasenameProfile = z.infer<typeof BasenameProfileSchema>
export type ISocialProfile = z.infer<typeof SocialProfileSchema>

const SocialProfilesResponseSchema = z.object({
  socialProfiles: z.array(SocialProfileSchema),
})

export type ISocialProfilesResponse = z.infer<typeof SocialProfilesResponseSchema>

export async function fetchSocialProfilesForAddress(args: { ethAddress: string }) {
  const { ethAddress } = args

  const { data } = await convosApi.get<ISocialProfilesResponse>(
    `/api/v1/lookup/address/${ethAddress}`,
  )

  const response = SocialProfilesResponseSchema.safeParse(data)

  if (!response.success) {
    captureError(new Error(`Invalid social profiles response: ${JSON.stringify(response.error)}`))
  }

  return data.socialProfiles as ISocialProfile[]
}
