export enum QueryKeys {
  // Conversations
  GROUPS = "groups",
  GROUP = "group",

  // Messages
  GROUP_MESSAGES = "groupMessages",
  GROUP_FIRST_MESSAGE = "groupFirstMessage",
  GROUP_PENDING_MESSAGES = "groupPendingMessages",

  // Members
  GROUP_MEMBERS = "groupMembers",

  // Mutable Metadata
  GROUP_NAME = "groupName",
  GROUP_DESCRIPTION = "groupDescription",
  GROUP_PHOTO = "groupPhoto",
  PINNED_FRAME = "pinnedFrame",
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
