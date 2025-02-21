import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";
import { z } from "zod";

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

export const profileValidationSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9\s]+$/, {
      message: "Name can only contain letters, numbers and spaces",
    }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(50, { message: "Username cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: "Username can only contain letters, numbers and dashes",
    }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  avatar: z.string().url({ message: "Avatar must be a valid URL" }).optional(),
});

// Export the type for reuse
export type IProfileValidation = z.infer<typeof profileValidationSchema>;
