import mmkv from "./mmkv";

const GROUP_INVITE_LINKS_STORAGE_KEY_PREFIX = "group-invites-link-";
const INVITE_ID_BY_GROUP_ID_STORAGE_KEY_PREFIX = "invite-id-by-group-id-";
const GROUP_JOIN_REQUEST_STORAGE_KEY_PREFIX = "group-join-request-";

export const createGroupInviteLinkStoragekey = (inviteId: string) => {
  return `${GROUP_INVITE_LINKS_STORAGE_KEY_PREFIX}${inviteId}`;
};

export const saveGroupInviteLink = (inviteId: string, groupId: string) => {
  return mmkv.set(createGroupInviteLinkStoragekey(inviteId), groupId);
};

export const getGroupInviteLink = (inviteId: string) => {
  return mmkv.getString(createGroupInviteLinkStoragekey(inviteId));
};

export const deleteGroupInviteLink = (inviteId: string) => {
  return mmkv.delete(createGroupInviteLinkStoragekey(inviteId));
};

export const createInviteIdByGroupIdStorageKey = (groupId: string) => {
  return `${INVITE_ID_BY_GROUP_ID_STORAGE_KEY_PREFIX}${groupId}`;
};

export const saveInviteIdByGroupId = (groupId: string, inviteId: string) => {
  return mmkv.set(createInviteIdByGroupIdStorageKey(groupId), inviteId);
};

export const getInviteIdByGroupId = (groupId: string) => {
  return mmkv.getString(createInviteIdByGroupIdStorageKey(groupId));
};

export const deleteInviteIdByGroupId = (groupId: string) => {
  return mmkv.delete(createInviteIdByGroupIdStorageKey(groupId));
};

const createGroupJoinStorageKey = (account: string, inviteId: string) => {
  return `${GROUP_JOIN_REQUEST_STORAGE_KEY_PREFIX}${inviteId}-${account}`;
};

export const saveInviteJoinRequest = (
  account: string,
  inviteId: string,
  joinRequestId: string
) => {
  return mmkv.set(createGroupJoinStorageKey(account, inviteId), joinRequestId);
};

export const getInviteJoinRequest = (account: string, inviteId: string) => {
  return mmkv.getString(createGroupJoinStorageKey(account, inviteId));
};

export const deleteInviteJoinRequest = (account: string, inviteId: string) => {
  return mmkv.delete(createGroupJoinStorageKey(account, inviteId));
};
