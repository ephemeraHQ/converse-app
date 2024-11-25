import type { ConversationTopic } from "@xmtp/react-native-sdk";
import {
  QueryKeys,
  groupDescriptionQueryKey,
  groupMembersQueryKey,
  groupNameQueryKey,
  groupPermissionsQueryKey,
  groupPhotoQueryKey,
  groupPinnedFrameQueryKey,
  conversationQueryKey,
  conversationsQueryKey,
} from "./QueryKeys";

describe("QueryKeys", () => {
  it("should match the snapshot", () => {
    expect(QueryKeys).toMatchSnapshot();
  });
});

describe("Query Key Functions", () => {
  const account = "testAccount";
  const topic = "testTopic" as ConversationTopic;

  it("conversationsQueryKey should return the correct array", () => {
    const result = conversationsQueryKey(account);
    expect(result).toEqual([QueryKeys.CONVERSATIONS, account.toLowerCase()]);
  });

  it("conversationQueryKey should return the correct array", () => {
    const result = conversationQueryKey(account, topic);
    expect(result).toEqual([
      QueryKeys.CONVERSATION,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupMembersQueryKey should return the correct array", () => {
    const result = groupMembersQueryKey(account, topic);
    expect(result).toEqual([
      QueryKeys.GROUP_MEMBERS,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupNameQueryKey should return the correct array", () => {
    const result = groupNameQueryKey(account, topic);
    expect(result).toEqual([
      QueryKeys.GROUP_NAME,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupDescriptionQueryKey should return the correct array", () => {
    const result = groupDescriptionQueryKey(account, topic);
    expect(result).toEqual([
      QueryKeys.GROUP_DESCRIPTION,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupPhotoQueryKey should return the correct array", () => {
    const result = groupPhotoQueryKey(account, topic);
    expect(result).toEqual([
      QueryKeys.GROUP_PHOTO,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupPinnedFrameQueryKey should return the correct array", () => {
    const result = groupPinnedFrameQueryKey(account, topic);
    expect(result).toEqual([
      QueryKeys.PINNED_FRAME,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("groupPermissionsQueryKey should return the correct array", () => {
    const result = groupPermissionsQueryKey(account, topic);
    expect(result).toEqual([
      QueryKeys.GROUP_PERMISSIONS,
      account.toLowerCase(),
      topic,
    ]);
  });
});
