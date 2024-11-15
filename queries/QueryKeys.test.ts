import {
  QueryKeys,
  groupDescriptionQueryKey,
  groupMembersQueryKey,
  groupNameQueryKey,
  groupPermissionsQueryKey,
  groupPhotoQueryKey,
  groupPinnedFrameQueryKey,
  groupQueryKey,
  groupsQueryKey,
} from "./QueryKeys";

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
