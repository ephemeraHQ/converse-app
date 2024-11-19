import type { ConversationTopic } from "@xmtp/react-native-sdk";

export enum QueryKeys {
  // Conversations
  CONVERSATIONS = "conversations", // When changing the shape of response, update the keys as persistance will break
  CONVERSATION = "conversation",
  V3_CONVERSATION_LIST = "v3ConversationList",

  // Messages
  CONVERSATION_MESSAGE = "conversationMessage",
  CONVERSATION_MESSAGES = "conversationMessages",

  // Members
  GROUP_MEMBERS = "groupMembersv2",
  ADDED_BY = "addedBy",

  // Group Mutable Metadata
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
}

export const conversationMessageQueryKey = (
  account: string,
  topic: ConversationTopic,
  messageId: string
) => [QueryKeys.CONVERSATION_MESSAGE, account.toLowerCase(), topic, messageId];

export const conversationsQueryKey = (account: string) => [
  QueryKeys.CONVERSATIONS,
  account.toLowerCase(),
];

export const conversationQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.CONVERSATION, account.toLowerCase(), topic];

export const conversationMessagesQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.CONVERSATION_MESSAGES, account.toLowerCase(), topic];

export const groupMembersQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_MEMBERS, account.toLowerCase(), topic];

export const groupNameQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_NAME, account.toLowerCase(), topic];

export const groupDescriptionQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_DESCRIPTION, account.toLowerCase(), topic];

export const groupPhotoQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_PHOTO, account.toLowerCase(), topic];

export const groupPinnedFrameQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.PINNED_FRAME, account.toLowerCase(), topic];

export const groupPermissionsQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_PERMISSIONS, account.toLowerCase(), topic];

export const groupConsentQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_CONSENT, account.toLowerCase(), topic];

export const addedByQueryKey = (account: string, topic: ConversationTopic) => [
  QueryKeys.ADDED_BY,
  account.toLowerCase(),
  topic,
];

export const groupIsActiveQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_ACTIVE, account.toLowerCase(), topic];

export const groupInviteQueryKey = (account: string, inviteId: string) => [
  QueryKeys.GROUP_INVITE,
  account.toLowerCase(),
  inviteId,
];

export const groupJoinRequestQueryKey = (
  account: string,
  requestId: string
) => [QueryKeys.GROUP_JOIN_REQUEST, account.toLowerCase(), requestId];

export const pendingJoinRequestsQueryKey = (account: string) => [
  QueryKeys.PENDING_JOIN_REQUESTS,
  account.toLowerCase(),
];
