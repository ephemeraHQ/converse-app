import { z } from "zod";
import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";

export const ConvosProfileForInboxSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  description: z.string().nullable(),
  // deviceIdentityId: z.string(),
  // createdAt: z.string(),
  // updatedAt: z.string(),
  xmtpId: z.string(),
  avatar: z.string().nullable(),
  privyAddress: z.string(),
});

export type IConvosProfileForInbox = z.infer<
  typeof ConvosProfileForInboxSchema
>;

export const updateProfile = async ({
  id,
  updates,
}: {
  id: string;
  updates: { name?: string; description?: string };
}) => {
  const { data } = await api.put(`/api/v1/profiles/${id}`, updates);
  const result = ConvosProfileForInboxSchema.safeParse(data);
  if (!result.success) {
    captureError(result.error);
  }
  return data;
};

export const fetchProfile = async ({
  xmtpId,
}: {
  xmtpId: string;
}): Promise<IConvosProfileForInbox> => {
  const { data } = await api.get(`/api/v1/profiles/${xmtpId}`);
  const result = ConvosProfileForInboxSchema.safeParse(data);
  if (!result.success) {
    captureError(result.error);
  }
  return data;
};

export const fetchAllProfilesForUser = async ({
  convosUserId,
}: {
  convosUserId: string;
}): Promise<IConvosProfileForInbox[]> => {
  const { data } = await api.get(`/api/v1/profiles/user/${convosUserId}`);
  const result = z.array(ConvosProfileForInboxSchema).safeParse(data);
  if (!result.success) {
    captureError(result.error);
  }
  return data;
};

const ClaimProfileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ClaimProfileRequest = {
  name: string;
  description?: string;
  username: string;
  avatar?: string;
};

export const claimProfile = async ({
  profile,
}: {
  profile: ClaimProfileRequest;
}) => {
  const { data } = await api.post("/api/profile/username", profile);
  logger.debug("[API PROFILES] claimProfile response:", data);
  return ClaimProfileResponseSchema.parse(data);
};
