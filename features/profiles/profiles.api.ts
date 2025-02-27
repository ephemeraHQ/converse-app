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

export const updateProfile = async (args: { xmtpId: string; updates: ProfileUpdates }) => {
  const { xmtpId, updates } = args;

  logger.debug("[updateProfile]", { 
    xmtpId, 
    fieldsToUpdate: Object.keys(updates),
    updates: JSON.stringify(updates)
  });
  
  try {
    const { data } = await api.put(`/api/v1/profiles/${xmtpId}`, updates);
    
    const result = ConvosProfileForInboxSchema.safeParse(data);
    if (!result.success) {
      captureError(result.error);
    }
    
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

export const saveProfileAsync = async (args: { profile: ProfileInput; inboxId: string }) => {
  const { profile, inboxId } = args;
  const xmtpId = profile.xmtpId || inboxId;
  
  logger.debug("[saveProfileAsync]", { 
    hasProfileId: !!profile.id,
    hasXmtpId: !!profile.xmtpId,
    inboxId,
    profile: JSON.stringify(profile)
  });
  
  try {
    if (xmtpId) {
      const updates: ProfileUpdates = {
        ...(profile.name !== undefined && { name: profile.name }),
        ...(profile.username !== undefined && { username: profile.username }),
        ...(profile.description !== undefined && { description: profile.description }),
        ...(profile.avatar !== undefined && { avatar: profile.avatar }),
      };
      
      return updateProfile({ xmtpId, updates });
    } 
    
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
