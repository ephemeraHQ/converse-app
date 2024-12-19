import type { ConversationTopic } from "@xmtp/react-native-sdk";

export enum QueryKeys {
  // Conversations
  CONVERSATIONS = "conversations",
  CONVERSATION = "conversation",
  CONVERSATION_DM = "conversationDM",

  // Messages
  CONVERSATION_MESSAGE = "conversationMessage",
  CONVERSATION_MESSAGES = "conversationMessages",

  // Members
  GROUP_MEMBERS = "groupMembersv2",

  // Group Mutable Metadata
  PINNED_FRAME = "pinnedFrame",
  GROUP_PERMISSION_POLICY = "groupPermissionPolicy",
  GROUP_CREATOR = "groupCreator",

  // Permissions
  GROUP_PERMISSIONS = "groupPermissions",

  // Group Invites
  GROUP_INVITE = "groupInvite",
  GROUP_JOIN_REQUEST = "groupJoinRequest",
  PENDING_JOIN_REQUESTS = "pendingJoinRequests",
}

// Conversations
export const conversationsQueryKey = (account: string) => [
  QueryKeys.CONVERSATIONS,
  account?.toLowerCase(),
];

export const conversationQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.CONVERSATION, account?.toLowerCase(), topic];

export const dmQueryKey = (account: string, peer: string) => [
  QueryKeys.CONVERSATION_DM,
  account.toLowerCase(),
  peer,
];

// Messages
export const conversationMessageQueryKey = (
  account: string,
  messageId: string
) => [QueryKeys.CONVERSATION_MESSAGE, account.toLowerCase(), messageId];

export const conversationMessagesQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.CONVERSATION_MESSAGES, account?.toLowerCase(), topic];

export const conversationPreviewMessagesQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.CONVERSATION_MESSAGES, account?.toLowerCase(), topic];

// Members
export const groupMembersQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_MEMBERS, account?.toLowerCase(), topic];

// Group Mutable Metadata
export const groupPinnedFrameQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.PINNED_FRAME, account?.toLowerCase(), topic];

export const groupPermissionPolicyQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_PERMISSION_POLICY, account.toLowerCase(), topic];

export const groupCreatorQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_CREATOR, account.toLowerCase(), topic];

// Permissions
export const groupPermissionsQueryKey = (
  account: string,
  topic: ConversationTopic
) => [QueryKeys.GROUP_PERMISSIONS, account?.toLowerCase(), topic];

// Group Invites
export const groupInviteQueryKey = (account: string, inviteId: string) => [
  QueryKeys.GROUP_INVITE,
  account?.toLowerCase(),
  inviteId,
];

export const groupJoinRequestQueryKey = (
  account: string,
  requestId: string
) => [QueryKeys.GROUP_JOIN_REQUEST, account?.toLowerCase(), requestId];

export const pendingJoinRequestsQueryKey = (account: string) => [
  QueryKeys.PENDING_JOIN_REQUESTS,
  account?.toLowerCase(),
];
