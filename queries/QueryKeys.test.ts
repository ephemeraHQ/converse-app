import {
  QueryKeys,
  groupDescriptionQueryKey,
  groupFirstMessageQueryKey,
  groupMembersQueryKey,
  groupMessagesQueryKey,
  groupNameQueryKey,
  groupPendingMessagesQueryKey,
  groupPhotoQueryKey,
  groupPinnedFrameQueryKey,
  groupQueryKey,
  groupsQueryKey,
} from "./QueryKeys"; // adjust the import path

describe("QueryKeys", () => {
  it("should match the snapshot", () => {
    expect(QueryKeys).toMatchSnapshot();
  });
});

describe("Query Key Functions", () => {
  const account = "testAccount";
  const topic = "testTopic";

  it("groupsQueryKey should return the correct array", () => {
    const result = groupsQueryKey(account);
    expect(result).toEqual([QueryKeys.GROUPS, account]);
  });

  it("groupQueryKey should return the correct array", () => {
    const result = groupQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP, account, topic]);
  });

  it("groupMessagesQueryKey should return the correct array", () => {
    const result = groupMessagesQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_MESSAGES, account, topic]);
  });

  it("groupFirstMessageQueryKey should return the correct array", () => {
    const result = groupFirstMessageQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_FIRST_MESSAGE, account, topic]);
  });

  it("groupPendingMessagesQueryKey should return the correct array", () => {
    const result = groupPendingMessagesQueryKey(account, topic);
    expect(result).toEqual([QueryKeys.GROUP_PENDING_MESSAGES, account, topic]);
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
});
