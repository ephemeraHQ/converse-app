import { z } from "zod"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { api } from "@/utils/api/api"
import { captureError } from "@/utils/capture-error"
import {
  ClaimProfileResponseSchema,
  ConvosProfileForInboxSchema,
  type ClaimProfileRequest,
  type IConvosProfileForInbox,
  type ProfileInput,
  type ProfileUpdates,
} from "./profile.types"

// Schema for profile update requests - only includes updatable fields
const ProfileUpdateRequestSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
})

/**
 * Compares a profile update with the current profile and returns only changed fields.
 * Handles both new profiles and updates to existing ones.
 */
const getProfileChanges = (args: {
  update: ProfileInput
  current?: IConvosProfileForInbox
}): ProfileUpdates => {
  const { update, current } = args

  // For new profiles, include all provided fields
  if (!current) {
    const updates: ProfileUpdates = {
      ...(update.name !== undefined && { name: update.name }),
      ...(update.username !== undefined && { username: update.username }),
      ...(update.description !== undefined && {
        description: update.description,
      }),
      ...(update.avatar !== undefined && { avatar: update.avatar }),
    }
    return updates
  }

  // For existing profiles, only include changed fields
  const updates: ProfileUpdates = {}

  if (update.name !== undefined && update.name !== current.name) {
    updates.name = update.name
  }

  if (update.username !== undefined && update.username !== current.username) {
    updates.username = update.username
  }

  if (update.description !== undefined && update.description !== current.description) {
    updates.description = update.description
  }

  if (update.avatar !== undefined && update.avatar !== current.avatar) {
    updates.avatar = update.avatar
  }

  return updates
}

/**
 * Normalizes profile data for the claim profile endpoint.
 * Converts null values to empty strings as required by the API.
 */
const normalizeProfileData = (profile: ProfileInput): ClaimProfileRequest => ({
  name: profile.name || "",
  username: profile.username || "",
  ...(profile.description !== undefined && {
    description: profile.description === null ? "" : profile.description,
  }),
  ...(profile.avatar !== undefined && {
    avatar: profile.avatar === null ? "" : profile.avatar,
  }),
})

export const updateProfile = async (args: { xmtpId: string; updates: ProfileUpdates }) => {
  const { xmtpId, updates } = args

  try {
    // Validate the update payload
    const validatedUpdates = ProfileUpdateRequestSchema.parse(updates)

    // Make the API call
    const { data } = await api.put(`/api/v1/profiles/${xmtpId}`, validatedUpdates)
    return data
  } catch (error) {
    throw error
  }
}

export const fetchProfile = async (args: { xmtpId: IXmtpInboxId }) => {
  const { xmtpId } = args

  const { data } = await api.get<IConvosProfileForInbox>(`/api/v1/profiles/${xmtpId}`)

  const result = ConvosProfileForInboxSchema.safeParse(data)
  if (!result.success) {
    captureError(result.error)
  }

  return data
}

export const fetchAllProfilesForUser = async (args: {
  convosUserId: string
}): Promise<IConvosProfileForInbox[]> => {
  const { convosUserId } = args

  const { data } = await api.get(`/api/v1/profiles/user/${convosUserId}`)

  const result = z.array(ConvosProfileForInboxSchema).safeParse(data)
  if (!result.success) {
    captureError(result.error)
  }

  return data
}

export const claimProfile = async (args: { profile: ClaimProfileRequest }) => {
  const { profile } = args

  try {
    const { data } = await api.post("/api/profile/username", profile)
    return ClaimProfileResponseSchema.parse(data)
  } catch (error) {
    throw error
  }
}

export const saveProfile = async (args: {
  profile: ProfileInput
  inboxId: IXmtpInboxId
  currentProfile?: IConvosProfileForInbox
}) => {
  const { profile, inboxId, currentProfile } = args
  const xmtpId = profile.xmtpId || inboxId

  try {
    if (xmtpId) {
      // Get only the changed fields
      const updates = getProfileChanges({
        update: profile,
        current: currentProfile,
      })

      // Only make the API call if there are actual changes
      if (Object.keys(updates).length > 0) {
        return updateProfile({ xmtpId, updates })
      }

      // If no changes, return the current profile
      return currentProfile
    }

    // For new profiles, claim it
    return claimProfile({
      profile: normalizeProfileData(profile),
    })
  } catch (error) {
    throw error
  }
}
