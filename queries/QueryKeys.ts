export enum QueryKeys {
  // Conversations
  GROUPS = "groupsv2", // When changing the shape of response, update the keys as persistance will break
  GROUP = "group",

  // Messages
  GROUP_MESSAGES = "groupMessages",
  GROUP_FIRST_MESSAGE = "groupFirstMessage",
  GROUP_PENDING_MESSAGES = "groupPendingMessages",

  // Members
  GROUP_MEMBERS = "groupMembersv2",
  ADDED_BY = "addedBy",

  // Mutable Metadata
  GROUP_NAME = "groupName",
  GROUP_DESCRIPTION = "groupDescription",
  GROUP_PHOTO = "groupPhoto",
  PINNED_FRAME = "pinnedFrame",

  // Permissions
  GROUP_PERMISSIONS = "groupPermissions",

  // Group Consent
  GROUP_CONSENT = "groupConsent",

  // Group info
  GROUP_ACTIVE = "groupActive",

  // Group Invites
  GROUP_INVITE = "groupInvite",
  GROUP_JOIN_REQUEST = "groupJoinRequest",
  PENDING_JOIN_REQUESTS = "pendingJoinRequests",

  // Profiles
  PROFILE_SOCIALS = "profileSocials",
}

export const groupsQueryKey = (account: string) => [QueryKeys.GROUPS, account];

export const groupQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP,
  account,
  topic,
];

export const groupMessagesQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_MESSAGES,
  account,
  topic,
];

export const groupFirstMessageQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_FIRST_MESSAGE,
  account,
  topic,
];

export const groupPendingMessagesQueryKey = (
  account: string,
  topic: string
) => [QueryKeys.GROUP_PENDING_MESSAGES, account, topic];

export const groupMembersQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_MEMBERS,
  account,
  topic,
];

export const groupNameQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_NAME,
  account,
  topic,
];

export const groupDescriptionQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_DESCRIPTION,
  account,
  topic,
];

export const groupPhotoQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_PHOTO,
  account,
  topic,
];

export const groupPinnedFrameQueryKey = (account: string, topic: string) => [
  QueryKeys.PINNED_FRAME,
  account,
  topic,
];

export const groupPermissionsQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_PERMISSIONS,
  account,
  topic,
];

export const groupConsentQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_CONSENT,
  account,
  topic,
];

export const addedByQueryKey = (account: string, topic: string) => [
  QueryKeys.ADDED_BY,
  account,
  topic,
];

export const groupIsActiveQueryKey = (account: string, topic: string) => [
  QueryKeys.GROUP_ACTIVE,
  account,
  topic,
];

export const groupInviteQueryKey = (account: string, inviteId: string) => [
  QueryKeys.GROUP_INVITE,
  account,
  inviteId,
];

export const groupJoinRequestQueryKey = (
  account: string,
  requestId: string
) => [QueryKeys.GROUP_JOIN_REQUEST, account, requestId];

export const pendingJoinRequestsQueryKey = (account: string) => [
  QueryKeys.PENDING_JOIN_REQUESTS,
  account,
];

export const profileSocialsQueryKey = (
  account: string,
  peerAddress: string
) => [QueryKeys.PROFILE_SOCIALS, account, peerAddress];
