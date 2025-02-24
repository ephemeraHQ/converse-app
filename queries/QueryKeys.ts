import type {
  ConsentState,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";

export enum QueryKeys {
  // Conversations
  CONVERSATIONS_SYNC_ALL = "conversation-sync-all",
  CONVERSATIONS_ALLOWED_CONSENT = "conversations-allowed-consent",
  CONVERSATIONS_UNKNOWN_CONSENT = "conversations-unknown-consent",
  CONVERSATION = "conversation",
  CONVERSATION_DM = "conversation-dm",
  CONVERSATION_METADATA = "conversation-metadata",
  CONVERSATIONS_SEARCH = "conversations-search",

  // Messages
  CONVERSATION_MESSAGE = "conversation-message",
  CONVERSATION_MESSAGES = "conversation-messages",

  // Members
  GROUP_MEMBERS = "group-members",

  // Group Mutable Metadata
  PINNED_FRAME = "pinned-frame",
  GROUP_PERMISSION_POLICY = "group-permission-policy",
  GROUP_CREATOR = "group-creator",

  // Permissions
  GROUP_PERMISSIONS = "group-permissions",

  // Group Invites
  GROUP_JOIN_REQUEST = "group-join-request",
  PENDING_JOIN_REQUESTS = "pending-join-requests",

  // DMs
  DM_PEER_INBOX_ID = "dm-peer-inbox-id",

  PRIVY_CUSTOM_METADATA = "privy-custom-metadata",

  // User search
  USER_SEARCH = "user-search",

  // Profile Socials
  PROFILE_SOCIALS = "profile-socials",
}

// // InboxId
// export const getInboxIdForAccountQueryKey = (account: string) => [
//   QueryKeys.INBOX_ID_FOR_ACCOUNT,
//   account?.toLowerCase(),
// ];

// Conversations
export const conversationSyncAllQueryKey = (args: {
  ethAddress: string;
  consentStates: ConsentState[];
}) => [
  QueryKeys.CONVERSATIONS_SYNC_ALL,
  args.ethAddress,
  args.consentStates.join(","),
];
export const allowedConsentConversationsQueryKey = (account: string) => [
  QueryKeys.CONVERSATIONS_ALLOWED_CONSENT,
  account?.toLowerCase(),
];
export const unknownConsentConversationsQueryKey = (account: string) => [
  QueryKeys.CONVERSATIONS_UNKNOWN_CONSENT,
  account?.toLowerCase(),
];

export const conversationQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.CONVERSATION, account?.toLowerCase(), topic];

export const dmQueryKey = (args: { account: string; inboxId: InboxId }) => [
  QueryKeys.CONVERSATION_DM,
  args.account?.toLowerCase(),
  args.inboxId?.toLowerCase(),
];
export const conversationMetadataQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.CONVERSATION_METADATA, account.toLowerCase(), topic];

// Messages
export const conversationMessageQueryKey = (
  account: string,
  messageId: string,
) => [QueryKeys.CONVERSATION_MESSAGE, account.toLowerCase(), messageId];

export const conversationMessagesQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.CONVERSATION_MESSAGES, account?.toLowerCase(), topic];

export const conversationPreviewMessagesQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.CONVERSATION_MESSAGES, account?.toLowerCase(), topic];

// Members
export const groupMembersQueryKey = (args: {
  account: string;
  topic: ConversationTopic;
}) => [QueryKeys.GROUP_MEMBERS, args.account?.toLowerCase(), args.topic];

// Group Mutable Metadata
export const groupPinnedFrameQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.PINNED_FRAME, account?.toLowerCase(), topic];

export const groupPermissionPolicyQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.GROUP_PERMISSION_POLICY, account.toLowerCase(), topic];

export const groupCreatorQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.GROUP_CREATOR, account.toLowerCase(), topic];

// Permissions
export const groupPermissionsQueryKey = (
  account: string,
  topic: ConversationTopic,
) => [QueryKeys.GROUP_PERMISSIONS, account?.toLowerCase(), topic];

// Group Invites
export const groupJoinRequestQueryKey = (
  account: string,
  requestId: string,
) => [QueryKeys.GROUP_JOIN_REQUEST, account?.toLowerCase(), requestId];

export const pendingJoinRequestsQueryKey = (account: string) => [
  QueryKeys.PENDING_JOIN_REQUESTS,
  account?.toLowerCase(),
];

// DMs
export const dmPeerInboxIdQueryKey = (args: {
  account: string;
  topic: ConversationTopic;
}) => [QueryKeys.DM_PEER_INBOX_ID, args.account, args.topic];

// Conversations Search
export const getSearchConvosUsersQueryKey = (searchQuery: string) => [
  QueryKeys.USER_SEARCH,
  searchQuery,
];

export const privyCustomMetadataQueryKey = (userId?: string) => [
  QueryKeys.PRIVY_CUSTOM_METADATA,
  userId?.toLowerCase(),
];

export const getSearchExistingGroupsByGroupNameQueryKey = (args: {
  searchQuery: string;
  inboxId: InboxId;
}) => [
  QueryKeys.CONVERSATIONS_SEARCH,
  "groups-by-name",
  args.searchQuery,
  args.inboxId,
];

export const getSearchExistingGroupsByMemberNameQueryKey = (args: {
  searchQuery: string;
  inboxId: InboxId;
}) => [
  QueryKeys.CONVERSATIONS_SEARCH,
  "groups-by-member-name",
  args.searchQuery,
  args.inboxId,
];

// Profiles
export const getProfileSocialsQueryKey = ({
  inboxId,
}: {
  inboxId: InboxId;
}) => [QueryKeys.PROFILE_SOCIALS, inboxId?.toLowerCase()];
