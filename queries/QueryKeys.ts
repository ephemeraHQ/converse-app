import type { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";

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
export const conversationsQueryKey = (args: { inboxId?: string }) => [
  QueryKeys.CONVERSATIONS,
  args.inboxId,
];

export const conversationQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.CONVERSATION, args.inboxId, args.topic];

export const dmQueryKey = (args: {
  inboxId: InboxId;
  peerInboxId: InboxId;
}) => [QueryKeys.CONVERSATION_DM, args.inboxId, args.peerInboxId];

// Messages
export const conversationMessageQueryKey = (args: {
  inboxId: InboxId;
  messageId: string;
}) => [QueryKeys.CONVERSATION_MESSAGE, args.inboxId, args.messageId];

export const conversationMessagesQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.CONVERSATION_MESSAGES, args.inboxId, args.topic];

export const conversationPreviewMessagesQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.CONVERSATION_MESSAGES, args.inboxId, args.topic];

// Members
export const groupMembersQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.GROUP_MEMBERS, args.inboxId, args.topic];

// Group Mutable Metadata
export const groupPinnedFrameQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.PINNED_FRAME, args.inboxId, args.topic];

export const groupPermissionPolicyQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.GROUP_PERMISSION_POLICY, args.inboxId, args.topic];

export const groupCreatorQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.GROUP_CREATOR, args.inboxId, args.topic];

// Permissions
export const groupPermissionsQueryKey = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => [QueryKeys.GROUP_PERMISSIONS, args.inboxId, args.topic];

// Group Invites
export const groupInviteQueryKey = (args: {
  inboxId: InboxId;
  inviteId: string;
}) => [QueryKeys.GROUP_INVITE, args.inboxId, args.inviteId];

export const groupJoinRequestQueryKey = (args: {
  inboxId: InboxId;
  requestId: string;
}) => [QueryKeys.GROUP_JOIN_REQUEST, args.inboxId, args.requestId];

export const pendingJoinRequestsQueryKey = (args: { inboxId: InboxId }) => [
  QueryKeys.PENDING_JOIN_REQUESTS,
  args.inboxId,
];
