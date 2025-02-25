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
  xmtpId,
  updates,
}: {
  xmtpId: string;
  updates: Record<string, string | null>;
}) => {
  logger.debug("[updateProfile]", { xmtpId, updates });

  // If no updates are provided, just fetch the current profile
  if (Object.keys(updates).length === 0) {
    return fetchProfile({ xmtpId });
  }

  // Sanitize updates by replacing null values with empty strings
  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [key, value ?? ''])
  );

  const { data } = await api.put(`/api/v1/profiles/${xmtpId}`, sanitizedUpdates);
  logger.debug("[updateProfile] Response", { data });

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
  logger.debug("[fetchProfile]", { xmtpId });
  
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
  logger.debug("[fetchAllProfilesForUser]", { convosUserId });
  
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
  logger.debug("[claimProfile]", { profile });
  
  const { data } = await api.post("/api/profile/username", profile);
  logger.debug("[claimProfile] Response", { data });
  
  return ClaimProfileResponseSchema.parse(data);
};

/**
 * Saves a profile by either updating an existing one or creating a new one.
 * 
 * @param args - Object containing profile data and inbox ID
 * @returns The updated or created profile data
 */
export const saveProfileAsync = async (args: {
  profile: {
    id?: string;
    name?: string;
    description?: string;
    username?: string;
    avatar?: string;
    xmtpId?: string;
  };
  inboxId: string;
}) => {
  const { profile, inboxId } = args;
  
  try {
    logger.debug("[saveProfileAsync]", { 
      hasProfileId: !!profile.id,
      hasXmtpId: !!profile.xmtpId,
      inboxId
    });
    
    // Update existing profile if we have an xmtpId
    if (profile.xmtpId) {
      // Pick only the fields that are present in the profile object
      const updates = Object.fromEntries(
        Object.entries(profile)
          .filter(([key]) => ['name', 'username', 'description', 'avatar'].includes(key))
          .filter(([_, value]) => value !== undefined)
      );
      
      return updateProfile({
        xmtpId: profile.xmtpId,
        updates,
      });
    } 
    
    // Create new profile
    return claimProfile({
      profile: {
        name: profile.name || '',
        username: profile.username || '',
        description: profile.description || '',
        avatar: profile.avatar || '',
      },
    });
  } catch (error) {
    logger.error("[saveProfileAsync] Error", error);
    throw error;
  }
};
