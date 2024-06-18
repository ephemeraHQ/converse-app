export enum MutationKeys {
  // Messages
  SEND_MESSAGE = "sendMessage",

  // Members
  ADD_MEMBER = "addMember",
  REMOVE_MEMBER = "removeMember",

  // Admins
  PROMOTE_ADMIN = "promoteAdmin",
  REVOKE_ADMIN = "revokeAdmin",
  PROMOTE_SUPER_ADMIN = "promoteSuperAdmin",
  REVOKE_SUPER_ADMIN = "revokeSuperAdmin",

  // Mutable Metadata
  SET_GROUP_NAME = "setGroupName",
  SET_GROUP_DESCRIPTION = "setGroupDescription",
  SET_GROUP_PHOTO = "setGroupPhoto",
  SET_PINNED_FRAME = "setPinnedFrame",
}

export const sendMessageMutationKey = (
  account: string,
  topic: string,
  messageId: string
) => [MutationKeys.SEND_MESSAGE, account, topic, messageId];

export const addMemberMutationKey = (account: string, topic: string) => [
  MutationKeys.ADD_MEMBER,
  account,
  topic,
];

export const removeMemberMutationKey = (account: string, topic: string) => [
  MutationKeys.REMOVE_MEMBER,
  account,
  topic,
];

export const promoteAdminMutationKey = (account: string, topic: string) => [
  MutationKeys.PROMOTE_ADMIN,
  account,
  topic,
];

export const revokeAdminMutationKey = (account: string, topic: string) => [
  MutationKeys.REVOKE_ADMIN,
  account,
  topic,
];

export const promoteSuperAdminMutationKey = (
  account: string,
  topic: string
) => [MutationKeys.PROMOTE_SUPER_ADMIN, account, topic];

export const revokeSuperAdminMutationKey = (account: string, topic: string) => [
  MutationKeys.REVOKE_SUPER_ADMIN,
  account,
  topic,
];

export const setGroupNameMutationKey = (account: string, topic: string) => [
  MutationKeys.SET_GROUP_NAME,
  account,
  topic,
];

export const setGroupDescriptionMutationKey = (
  account: string,
  topic: string
) => [MutationKeys.SET_GROUP_DESCRIPTION, account, topic];

export const setGroupPhotoMutationKey = (account: string, topic: string) => [
  MutationKeys.SET_GROUP_PHOTO,
  account,
  topic,
];

export const setPinnedFrameMutationKey = (account: string, topic: string) => [
  MutationKeys.SET_PINNED_FRAME,
  account,
  topic,
];
