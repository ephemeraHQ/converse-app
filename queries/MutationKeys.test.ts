import type { ConversationTopic } from "@xmtp/react-native-sdk";
import {
  addMemberMutationKey,
  MutationKeys,
  promoteAdminMutationKey,
  promoteSuperAdminMutationKey,
  removeMemberMutationKey,
  revokeAdminMutationKey,
  revokeSuperAdminMutationKey,
  sendMessageMutationKey,
  setGroupDescriptionMutationKey,
  setGroupNameMutationKey,
  setGroupPhotoMutationKey,
  setPinnedFrameMutationKey,
} from "./MutationKeys"; // adjust the import path

describe("MutationKeys", () => {
  it("should match the snapshot", () => {
    expect(MutationKeys).toMatchSnapshot();
  });
});

describe("Mutation Key Functions", () => {
  const account = "testAccount";
  const topic = "testTopic" as ConversationTopic;
  const messageId = "testMessageId";

  it("sendMessageMutationKey should return the correct array", () => {
    const result = sendMessageMutationKey(account, topic, messageId);
    expect(result).toEqual([
      MutationKeys.SEND_MESSAGE,
      account,
      topic,
      messageId,
    ]);
  });

  it("addMemberMutationKey should return the correct array", () => {
    const result = addMemberMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.ADD_MEMBER, account, topic]);
  });

  it("removeMemberMutationKey should return the correct array", () => {
    const result = removeMemberMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.REMOVE_MEMBER, account, topic]);
  });

  it("promoteAdminMutationKey should return the correct array", () => {
    const result = promoteAdminMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.PROMOTE_ADMIN, account, topic]);
  });

  it("revokeAdminMutationKey should return the correct array", () => {
    const result = revokeAdminMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.REVOKE_ADMIN, account, topic]);
  });

  it("promoteSuperAdminMutationKey should return the correct array", () => {
    const result = promoteSuperAdminMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.PROMOTE_SUPER_ADMIN, account, topic]);
  });

  it("revokeSuperAdminMutationKey should return the correct array", () => {
    const result = revokeSuperAdminMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.REVOKE_SUPER_ADMIN, account, topic]);
  });

  it("setGroupNameMutationKey should return the correct array", () => {
    const result = setGroupNameMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.SET_GROUP_NAME, account, topic]);
  });

  it("setGroupDescriptionMutationKey should return the correct array", () => {
    const result = setGroupDescriptionMutationKey(account, topic);
    expect(result).toEqual([
      MutationKeys.SET_GROUP_DESCRIPTION,
      account,
      topic,
    ]);
  });

  it("setGroupPhotoMutationKey should return the correct array", () => {
    const result = setGroupPhotoMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.SET_GROUP_PHOTO, account, topic]);
  });

  it("setPinnedFrameMutationKey should return the correct array", () => {
    const result = setPinnedFrameMutationKey(account, topic);
    expect(result).toEqual([MutationKeys.SET_PINNED_FRAME, account, topic]);
  });
});
