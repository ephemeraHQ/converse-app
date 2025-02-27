import { z } from "zod";
import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";
import {
  ConvosProfileForInboxSchema,
  ClaimProfileResponseSchema,
  type ProfileUpdates,
  type ProfileInput,
  type ClaimProfileRequest,
  type IConvosProfileForInbox,
} from "./profile.types";

// Schema for profile update requests - only includes updatable fields
const ProfileUpdateRequestSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

/**
 * Compares a profile update with the current profile and returns only changed fields.
 * Handles both new profiles and updates to existing ones.
 */
const getProfileChanges = (args: {
  update: ProfileInput;
  current?: IConvosProfileForInbox;
}): ProfileUpdates => {
  const { update, current } = args;
  
  logger.debug("[getProfileChanges]", {
    update: JSON.stringify(update),
    current: current ? JSON.stringify(current) : undefined
  });

  // For new profiles, include all provided fields
  if (!current) {
    const updates: ProfileUpdates = {
      ...(update.name !== undefined && { name: update.name }),
      ...(update.username !== undefined && { username: update.username }),
      ...(update.description !== undefined && { description: update.description }),
      ...(update.avatar !== undefined && { avatar: update.avatar }),
    };
    
    logger.debug("[getProfileChanges] New profile", { updates: JSON.stringify(updates) });
    return updates;
  }

  // For existing profiles, only include changed fields
  const updates: ProfileUpdates = {};
  
  if (update.name !== undefined && update.name !== current.name) {
    updates.name = update.name;
  }
  
  if (update.username !== undefined && update.username !== current.username) {
    updates.username = update.username;
  }
  
  if (update.description !== undefined && update.description !== current.description) {
    updates.description = update.description;
  }
  
  if (update.avatar !== undefined && update.avatar !== current.avatar) {
    updates.avatar = update.avatar;
  }

  logger.debug("[getProfileChanges] Changed fields", { 
    updates: JSON.stringify(updates),
    changedFields: Object.keys(updates)
  });
  
  return updates;
};

/**
 * Normalizes profile data for the claim profile endpoint.
 * Converts null values to empty strings as required by the API.
 */
const normalizeProfileData = (profile: ProfileInput): ClaimProfileRequest => ({
  name: profile.name || "",
  username: profile.username || "",
  ...(profile.description !== undefined && { 
    description: profile.description === null ? "" : profile.description 
  }),
  ...(profile.avatar !== undefined && { 
    avatar: profile.avatar === null ? "" : profile.avatar 
  }),
});

export const updateProfile = async (args: { xmtpId: string; updates: ProfileUpdates }) => {
  const { xmtpId, updates } = args;

  logger.debug("[updateProfile]", { 
    xmtpId, 
    fieldsToUpdate: Object.keys(updates),
    updates: JSON.stringify(updates)
  });
  
  try {
    // Validate the update payload
    const validatedUpdates = ProfileUpdateRequestSchema.parse(updates);
    
    // Make the API call
    const { data } = await api.put(`/api/v1/profiles/${xmtpId}`, validatedUpdates);
    return data;
  } catch (error) {
    logger.error("[updateProfile]", { 
      error, 
      requestPayload: updates,
      endpoint: `/api/v1/profiles/${xmtpId}`
    });
    throw error;
  }
};

export const fetchProfile = async (args: { xmtpId: string }): Promise<IConvosProfileForInbox> => {
  const { xmtpId } = args;
  logger.debug("[fetchProfile]", { xmtpId });
  
  const { data } = await api.get(`/api/v1/profiles/${xmtpId}`);
  
  const result = ConvosProfileForInboxSchema.safeParse(data);
  if (!result.success) {
    captureError(result.error);
  }
  
  return data;
};

export const fetchAllProfilesForUser = async (args: { convosUserId: string }): Promise<IConvosProfileForInbox[]> => {
  const { convosUserId } = args;
  logger.debug("[fetchAllProfilesForUser]", { convosUserId });
  
  const { data } = await api.get(`/api/v1/profiles/user/${convosUserId}`);
  
  const result = z.array(ConvosProfileForInboxSchema).safeParse(data);
  if (!result.success) {
    captureError(result.error);
  }
  
  return data;
};

export const claimProfile = async (args: { profile: ClaimProfileRequest }) => {
  const { profile } = args;
  
  logger.debug("[claimProfile]", { profile: JSON.stringify(profile) });
  
  try {
    const { data } = await api.post("/api/profile/username", profile);
    return ClaimProfileResponseSchema.parse(data);
  } catch (error) {
    logger.error("[claimProfile]", { 
      error, 
      requestPayload: profile,
      endpoint: "/api/profile/username"
    });
    throw error;
  }
};

export const saveProfileAsync = async (args: { 
  profile: ProfileInput; 
  inboxId: string;
  currentProfile?: IConvosProfileForInbox;
}) => {
  const { profile, inboxId, currentProfile } = args;
  const xmtpId = profile.xmtpId || inboxId;
  
  logger.debug("[saveProfileAsync]", { 
    hasProfileId: !!profile.id,
    hasXmtpId: !!profile.xmtpId,
    inboxId,
    profile: JSON.stringify(profile)
  });
  
  try {
    if (xmtpId) {
      // Get only the changed fields
      const updates = getProfileChanges({ 
        update: profile,
        current: currentProfile
      });
      
      // Only make the API call if there are actual changes
      if (Object.keys(updates).length > 0) {
        return updateProfile({ xmtpId, updates });
      }
      
      // If no changes, return the current profile
      return currentProfile;
    } 
    
    // For new profiles, claim it
    return claimProfile({
      profile: normalizeProfileData(profile)
    });
  } catch (error) {
    logger.error("[saveProfileAsync]", {
      error,
      profile: JSON.stringify(profile),
      inboxId
    });
    throw error;
  }
};
