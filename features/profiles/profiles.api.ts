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

// Define a type for profile updates
export type ProfileUpdates = Partial<{
  name: string;
  username: string;
  description: string | null;
  avatar: string | null;
}>;

// Define a type for profile input that matches our internal usage
export type ProfileInput = {
  id?: string;
  name?: string;
  description?: string | null;
  username?: string;
  avatar?: string | null;
  xmtpId?: string;
};

export type ClaimProfileRequest = {
  name: string;
  description?: string;
  username: string;
  avatar?: string;
};

/**
 * Updates a profile with only the fields that have changed.
 * This is a true partial update - only sends the fields provided.
 */
export const updateProfile = async ({
  xmtpId,
  updates,
}: {
  xmtpId: string;
  updates: ProfileUpdates;
}) => {
  logger.debug("[updateProfile] Request payload", { 
    xmtpId, 
    fieldsToUpdate: Object.keys(updates),
    updates: JSON.stringify(updates)
  });

  // CRITICAL FIX: Always send the update, even if there are no changes
  // This ensures the PUT request is always sent to the backend
  
  // Send the partial update directly - no need for additional processing
  try {
    logger.debug("[updateProfile] Sending PUT request", {
      endpoint: `/api/v1/profiles/${xmtpId}`,
      payload: JSON.stringify(updates)
    });
    
    const { data } = await api.put(`/api/v1/profiles/${xmtpId}`, updates);
    logger.debug("[updateProfile] Response", { data });

    const result = ConvosProfileForInboxSchema.safeParse(data);
    if (!result.success) {
      captureError(result.error);
    }
    
    return data;
  } catch (error) {
    // Log all errors with the request details
    logger.error("[updateProfile] Error response", { 
      error, 
      requestPayload: updates,
      endpoint: `/api/v1/profiles/${xmtpId}`
    });
    throw error;
  }
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

export const claimProfile = async ({
  profile,
}: {
  profile: ClaimProfileRequest;
}) => {
  logger.debug("[claimProfile] Request payload", { 
    profile: JSON.stringify(profile)
  });
  
  try {
    const { data } = await api.post("/api/profile/username", profile);
    logger.debug("[claimProfile] Response", { data });
    
    return ClaimProfileResponseSchema.parse(data);
  } catch (error) {
    logger.error("[claimProfile] Error response", { 
      error, 
      requestPayload: profile,
      endpoint: "/api/profile/username"
    });
    throw error;
  }
};

/**
 * Extract only the updatable fields from a profile object
 * Includes null values as they represent intentional clearing of fields
 */
const extractUpdatableFields = (profile: ProfileInput): ProfileUpdates => {
  const { name, username, description, avatar } = profile;
  const updates: ProfileUpdates = {};
  
  // CRITICAL FIX: Always include name and username in updates
  // These are required fields and should always be sent
  if (name !== undefined) updates.name = name;
  if (username !== undefined) updates.username = username;
  if (description !== undefined) updates.description = description;
  if (avatar !== undefined) updates.avatar = avatar;
  
  return updates;
};

/**
 * Convert nullable fields to empty strings for the ClaimProfile API
 * which doesn't accept null values
 */
const prepareClaimProfileData = (profile: ProfileInput): ClaimProfileRequest => {
  return {
    name: profile.name || '',
    username: profile.username || '',
    // Convert null to empty string for optional fields
    ...(profile.description !== undefined && { 
      description: profile.description === null ? '' : profile.description
    }),
    ...(profile.avatar !== undefined && { 
      avatar: profile.avatar === null ? '' : profile.avatar
    }),
  };
};

/**
 * Saves a profile by either updating an existing one or creating a new one.
 * Only sends fields that have changed to minimize data transfer.
 * Handles null values as intentional clearing of fields.
 * 
 * @param args - Object containing profile data and inbox ID
 * @returns The updated or created profile data
 */
export const saveProfileAsync = async (args: {
  profile: ProfileInput;
  inboxId: string;
}) => {
  const { profile, inboxId } = args;
  
  try {
    // CRITICAL FIX: Use the profile directly without extracting fields again
    // This prevents duplicate processing and ensures all fields are sent
    
    logger.debug("[saveProfileAsync] Starting", { 
      hasProfileId: !!profile.id,
      hasXmtpId: !!profile.xmtpId,
      inboxId,
      profileFields: Object.keys(profile),
      profileValues: JSON.stringify(profile)
    });
    
    // CRITICAL: Ensure xmtpId is set correctly for the update
    const xmtpIdToUse = profile.xmtpId || inboxId;
    
    logger.debug("[saveProfileAsync] Using xmtpId", { 
      profileXmtpId: profile.xmtpId,
      inboxId,
      xmtpIdToUse
    });
    
    // Update existing profile if we have an xmtpId
    if (xmtpIdToUse) {
      // Extract only the updatable fields for the API
      const updates: ProfileUpdates = {};
      if (profile.name !== undefined) updates.name = profile.name;
      if (profile.username !== undefined) updates.username = profile.username;
      if (profile.description !== undefined) updates.description = profile.description;
      if (profile.avatar !== undefined) updates.avatar = profile.avatar;
      
      logger.debug("[saveProfileAsync] Updating existing profile", {
        xmtpId: xmtpIdToUse,
        updates: JSON.stringify(updates),
        updateFields: Object.keys(updates)
      });
      
      return updateProfile({
        xmtpId: xmtpIdToUse,
        updates,
      });
    } 
    
    // Create new profile - for new profiles we need all required fields
    const claimProfileData = prepareClaimProfileData(profile);
    logger.debug("[saveProfileAsync] Creating new profile", {
      preparedData: JSON.stringify(claimProfileData)
    });
    return claimProfile({
      profile: claimProfileData
    });
  } catch (error) {
    logger.error("[saveProfileAsync] Error", {
      error,
      profile: JSON.stringify(profile),
      inboxId
    });
    throw error;
  }
};
