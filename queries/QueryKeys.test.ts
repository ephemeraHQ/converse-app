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
    expect(result).toEqual([QueryKeys.CONVERSATIONS, account]);
  });

  it("conversationQueryKey should return the correct array", () => {
    const result = conversationQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.CONVERSATION, account, topic]);
  });

  it("groupMembersQueryKey should return the correct array", () => {
    const result = groupMembersQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_MEMBERS, account, topic]);
  });

  it("groupNameQueryKey should return the correct array", () => {
    const result = groupNameQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_NAME, account, topic]);
  });

  it("groupDescriptionQueryKey should return the correct array", () => {
    const result = groupDescriptionQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_DESCRIPTION, account, topic]);
  });

  it("groupPhotoQueryKey should return the correct array", () => {
    const result = groupPhotoQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_PHOTO, account, topic]);
  });

  it("groupPinnedFrameQueryKey should return the correct array", () => {
    const result = groupPinnedFrameQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.PINNED_FRAME, account, topic]);
  });

  it("groupPermissionsQueryKey should return the correct array", () => {
    const result = groupPermissionsQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_PERMISSIONS, account, topic]);
  });
});
