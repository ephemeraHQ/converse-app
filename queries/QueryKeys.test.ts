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
  const account = "TestAccount";
  const topic = "testTopic" as ConversationTopic;
  const peer = "testPeer";
  const messageId = "testMessageId";
  const inviteId = "testInviteId";
  const requestId = "testRequestId";

  // Conversations
  it("conversationsQueryKey should return correct array", () => {
    expect(conversationsQueryKey(account)).toEqual([
      QueryKeys.CONVERSATIONS,
      account.toLowerCase(),
    ]);
  });

  it("conversationQueryKey should return correct array", () => {
    expect(conversationQueryKey(account, topic)).toEqual([
      QueryKeys.CONVERSATION,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("dmQueryKey should return correct array", () => {
    expect(dmQueryKey(account, peer)).toEqual([
      QueryKeys.CONVERSATION_DM,
      account.toLowerCase(),
      peer,
    ]);
  });

  // Messages
  it("conversationMessageQueryKey should return correct array", () => {
    expect(conversationMessageQueryKey(account, messageId)).toEqual([
      QueryKeys.CONVERSATION_MESSAGE,
      account.toLowerCase(),
      messageId,
    ]);
  });

  it("conversationMessagesQueryKey should return correct array", () => {
    expect(conversationMessagesQueryKey(account, topic)).toEqual([
      QueryKeys.CONVERSATION_MESSAGES,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("conversationPreviewMessagesQueryKey should return correct array", () => {
    expect(conversationPreviewMessagesQueryKey(account, topic)).toEqual([
      QueryKeys.CONVERSATION_MESSAGES,
      account.toLowerCase(),
      topic,
    ]);
  });

  // Members
  it("groupMembersQueryKey should return correct array", () => {
    expect(groupMembersQueryKey(account, topic)).toEqual([
      QueryKeys.GROUP_MEMBERS,
      account.toLowerCase(),
      topic,
    ]);
  });

  // Group Mutable Metadata
  it("groupPinnedFrameQueryKey should return correct array", () => {
    expect(groupPinnedFrameQueryKey(account, topic)).toEqual([
      QueryKeys.PINNED_FRAME,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupPermissionPolicyQueryKey should return correct array", () => {
    expect(groupPermissionPolicyQueryKey(account, topic)).toEqual([
      QueryKeys.GROUP_PERMISSION_POLICY,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupCreatorQueryKey should return correct array", () => {
    expect(groupCreatorQueryKey(account, topic)).toEqual([
      QueryKeys.GROUP_CREATOR,
      account.toLowerCase(),
      topic,
    ]);
  });

  // Permissions
  it("groupPermissionsQueryKey should return correct array", () => {
    expect(groupPermissionsQueryKey(account, topic)).toEqual([
      QueryKeys.GROUP_PERMISSIONS,
      account.toLowerCase(),
      topic,
    ]);
  });

  // Group Invites
  it("groupInviteQueryKey should return correct array", () => {
    expect(groupInviteQueryKey(account, inviteId)).toEqual([
      QueryKeys.GROUP_INVITE,
      account.toLowerCase(),
      inviteId,
    ]);
  });

  it("groupJoinRequestQueryKey should return correct array", () => {
    expect(groupJoinRequestQueryKey(account, requestId)).toEqual([
      QueryKeys.GROUP_JOIN_REQUEST,
      account.toLowerCase(),
      requestId,
    ]);
  });

  it("pendingJoinRequestsQueryKey should return correct array", () => {
    expect(pendingJoinRequestsQueryKey(account)).toEqual([
      QueryKeys.PENDING_JOIN_REQUESTS,
      account.toLowerCase(),
    ]);
  });

  // Case sensitivity tests
  it("should convert account to lowercase consistently", () => {
    const mixedCaseAccount = "MiXeDcAsE";
    expect(conversationsQueryKey(mixedCaseAccount)[1]).toBe(
      mixedCaseAccount.toLowerCase()
    );
  });
});
