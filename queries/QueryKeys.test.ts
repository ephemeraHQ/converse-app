import type { ConversationTopic } from "@xmtp/react-native-sdk";
import {
  QueryKeys,
  conversationsQueryKey,
  conversationQueryKey,
  dmQueryKey,
  conversationMessageQueryKey,
  conversationMessagesQueryKey,
  conversationPreviewMessagesQueryKey,
  groupMembersQueryKey,
  groupPinnedFrameQueryKey,
  groupPermissionPolicyQueryKey,
  groupCreatorQueryKey,
  groupPermissionsQueryKey,
  groupInviteQueryKey,
  groupJoinRequestQueryKey,
  pendingJoinRequestsQueryKey,
} from "./QueryKeys";

describe("QueryKeys", () => {
  it("should match the snapshot", () => {
    expect(QueryKeys).toMatchSnapshot();
  });
});

describe("Query Key Functions", () => {
  const inboxId = "TestInboxId";
  const topic = "testTopic" as ConversationTopic;
  const peer = "testPeer";
  const messageId = "testMessageId";
  const inviteId = "testInviteId";
  const requestId = "testRequestId";

  // Conversations
  it("conversationsQueryKey should return correct array", () => {
    expect(conversationsQueryKey({ inboxId })).toEqual([
      QueryKeys.CONVERSATIONS,
      inboxId,
    ]);
  });

  it("conversationQueryKey should return correct array", () => {
    expect(conversationQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.CONVERSATION,
      inboxId,
      topic,
    ]);
  });

  it("dmQueryKey should return correct array", () => {
    expect(dmQueryKey({ inboxId, peer })).toEqual([
      QueryKeys.CONVERSATION_DM,
      inboxId,
      peer,
    ]);
  });

  // Messages
  it("conversationMessageQueryKey should return correct array", () => {
    expect(conversationMessageQueryKey({ inboxId, messageId })).toEqual([
      QueryKeys.CONVERSATION_MESSAGE,
      inboxId,
      messageId,
    ]);
  });

  it("conversationMessagesQueryKey should return correct array", () => {
    expect(conversationMessagesQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.CONVERSATION_MESSAGES,
      inboxId,
      topic,
    ]);
  });

  it("conversationPreviewMessagesQueryKey should return correct array", () => {
    expect(conversationPreviewMessagesQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.CONVERSATION_MESSAGES,
      inboxId,
      topic,
    ]);
  });

  // Members
  it("groupMembersQueryKey should return correct array", () => {
    expect(groupMembersQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.GROUP_MEMBERS,
      inboxId,
      topic,
    ]);
  });

  // Group Mutable Metadata
  it("groupPinnedFrameQueryKey should return correct array", () => {
    expect(groupPinnedFrameQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.PINNED_FRAME,
      inboxId,
      topic,
    ]);
  });

  it("groupPermissionPolicyQueryKey should return correct array", () => {
    expect(groupPermissionPolicyQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.GROUP_PERMISSION_POLICY,
      inboxId,
      topic,
    ]);
  });

  it("groupCreatorQueryKey should return correct array", () => {
    expect(groupCreatorQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.GROUP_CREATOR,
      inboxId,
      topic,
    ]);
  });

  // Permissions
  it("groupPermissionsQueryKey should return correct array", () => {
    expect(groupPermissionsQueryKey({ inboxId, topic })).toEqual([
      QueryKeys.GROUP_PERMISSIONS,
      inboxId,
      topic,
    ]);
  });

  // Group Invites
  it("groupInviteQueryKey should return correct array", () => {
    expect(groupInviteQueryKey({ inboxId, inviteId })).toEqual([
      QueryKeys.GROUP_INVITE,
      inboxId,
      inviteId,
    ]);
  });

  it("groupJoinRequestQueryKey should return correct array", () => {
    expect(groupJoinRequestQueryKey({ inboxId, requestId })).toEqual([
      QueryKeys.GROUP_JOIN_REQUEST,
      inboxId,
      requestId,
    ]);
  });

  it("pendingJoinRequestsQueryKey should return correct array", () => {
    expect(pendingJoinRequestsQueryKey({ inboxId })).toEqual([
      QueryKeys.PENDING_JOIN_REQUESTS,
      inboxId,
    ]);
  });

  // Case sensitivity tests
  it("should convert account to lowercase consistently", () => {
    const mixedCaseInboxId = "MiXeDcAsE";
    expect(conversationsQueryKey({ inboxId: mixedCaseInboxId })[1]).toBe(
      mixedCaseInboxId.toLowerCase()
    );
  });
});
