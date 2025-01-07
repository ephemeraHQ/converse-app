import type { ConversationTopic } from "@xmtp/react-native-sdk";

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

  // Group Consent
  ALLOW_GROUP = "allowGroup",
  BLOCK_GROUP = "blockGroup",

  // Group Invites
  CREATE_GROUP_JOIN_REQUEST = "createGroupJoinRequest",
}

export const sendMessageMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
  messageId: string;
}) => [MutationKeys.SEND_MESSAGE, args.inboxId, args.topic, args.messageId];

export const addMemberMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.ADD_MEMBER, args.inboxId, args.topic];

export const removeMemberMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.REMOVE_MEMBER, args.inboxId, args.topic];

export const promoteAdminMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.PROMOTE_ADMIN, args.inboxId, args.topic];

export const revokeAdminMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.REVOKE_ADMIN, args.inboxId, args.topic];

export const promoteSuperAdminMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.PROMOTE_SUPER_ADMIN, args.inboxId, args.topic];

export const revokeSuperAdminMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.REVOKE_SUPER_ADMIN, args.inboxId, args.topic];

export const setGroupNameMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.SET_GROUP_NAME, args.inboxId, args.topic];

export const setGroupDescriptionMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.SET_GROUP_DESCRIPTION, args.inboxId, args.topic];

export const setGroupPhotoMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.SET_GROUP_PHOTO, args.inboxId, args.topic];

export const setPinnedFrameMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.SET_PINNED_FRAME, args.inboxId, args.topic];

export const blockGroupMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.BLOCK_GROUP, args.inboxId, args.topic];

export const createGroupJoinRequestMutationKey = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => [MutationKeys.CREATE_GROUP_JOIN_REQUEST, args.inboxId, args.topic];
