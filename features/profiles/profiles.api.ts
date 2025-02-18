import { api } from "@/utils/api/api";
import { logger } from "@/utils/logger";
import { z } from "zod";

export const ConvosProfileForInboxSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  deviceIdentityId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
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
  return ConvosProfileForInboxSchema.parse(data);
};

export const fetchProfile = async ({
  xmtpId,
}: {
  xmtpId: string;
}): Promise<IConvosProfileForInbox> => {
  const { data } = await api.get(`/api/v1/profiles/${xmtpId}`);
  return ConvosProfileForInboxSchema.parse(data);
};

export const fetchAllProfilesForUser = async ({
  convosUserId,
}: {
  convosUserId: string;
}): Promise<IConvosProfileForInbox[]> => {
  const { data } = await api.get(`/api/v1/profiles/user/${convosUserId}`);
  return z.array(ConvosProfileForInboxSchema).parse(data);
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

const profileValidationSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .optional(),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(30, { message: "Username cannot exceed 30 characters" })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Username can only contain letters and numbers",
    })
    .optional(),
  avatar: z.string().url({ message: "Avatar must be a valid URL" }).optional(),
});
