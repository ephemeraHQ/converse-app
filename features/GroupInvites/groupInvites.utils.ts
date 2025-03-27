import { storage } from "@/utils/storage/storage"

const GROUP_INVITE_LINKS_STORAGE_KEY_PREFIX = "group-invites-link-"
const INVITE_ID_BY_GROUP_ID_STORAGE_KEY_PREFIX = "invite-id-by-group-id-"

export const createGroupInviteLinkStoragekey = (inviteId: string) => {
  return `${GROUP_INVITE_LINKS_STORAGE_KEY_PREFIX}${inviteId}`
}

export const saveGroupInviteLink = (inviteId: string, groupId: string) => {
  return storage.set(createGroupInviteLinkStoragekey(inviteId), groupId)
}

export const getGroupInviteLink = (inviteId: string) => {
  return storage.getString(createGroupInviteLinkStoragekey(inviteId))
}

export const deleteGroupInviteLink = (inviteId: string) => {
  return storage.delete(createGroupInviteLinkStoragekey(inviteId))
}

export const createInviteIdByGroupIdStorageKey = (groupId: string) => {
  return `${INVITE_ID_BY_GROUP_ID_STORAGE_KEY_PREFIX}${groupId}`
}

export const saveInviteIdByGroupId = (groupId: string, inviteId: string) => {
  return storage.set(createInviteIdByGroupIdStorageKey(groupId), inviteId)
}

export const getInviteIdByGroupId = (groupId: string) => {
  return storage.getString(createInviteIdByGroupIdStorageKey(groupId))
}

export const deleteInviteIdByGroupId = (groupId: string) => {
  return storage.delete(createInviteIdByGroupIdStorageKey(groupId))
}
