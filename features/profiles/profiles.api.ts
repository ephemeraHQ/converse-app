import type { ProfileType } from "@/features/onboarding/types/onboarding.types";
import { api } from "@/utils/api/api";
import { logger } from "@/utils/logger";
import { z } from "zod";

const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  deviceIdentityId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IProfile = z.infer<typeof ProfileSchema>;

const SearchProfilesResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  xmtpId: z.string(),
});

export type ISearchProfilesResult = z.infer<typeof SearchProfilesResultSchema>;

export const getProfile = async (id: string): Promise<IProfile> => {
  const { data } = await api.get(`/api/v1/profiles/${id}`);
  return ProfileSchema.parse(data);
};

export const getAllProfilesForUser = async ({
  convosUserId,
}: {
  convosUserId: string;
}): Promise<IProfile[]> => {
  const { data } = await api.get(`/api/v1/profiles/user/${convosUserId}`);
  return z.array(ProfileSchema).parse(data);
};

export const searchProfiles = async ({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<ISearchProfilesResult[]> => {
  const { data } = await api.get("/api/v1/profiles/search", {
    params: { query: searchQuery },
  });
  return z.array(SearchProfilesResultSchema).parse(data);
};

export const createProfile = async (
  deviceIdentityId: string,
  profile: { name: string; description?: string }
) => {
  const { data } = await api.post(
    `/api/v1/profiles/${deviceIdentityId}`,
    profile
  );
  return ProfileSchema.parse(data);
};

export const updateProfile = async (
  id: string,
  updates: { name?: string; description?: string }
) => {
  const { data } = await api.put(`/api/v1/profiles/${id}`, updates);
  return ProfileSchema.parse(data);
};

const ClaimProfileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const claimProfile = async ({ profile }: { profile: ProfileType }) => {
  const { data } = await api.post("/api/profile/username", profile);
  logger.debug("[API PROFILES] claimProfile response:", data);
  return ClaimProfileResponseSchema.parse(data);
};

const UsernameValidResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const checkCanClaimUsername = async ({
  username,
}: {
  username: string;
}) => {
  const { data } = await api.get("/api/profile/username/valid", {
    params: { username },
  });
  logger.debug("[API PROFILES] checkCanClaimUsername response:", data);
  return UsernameValidResponseSchema.parse(data);
};
