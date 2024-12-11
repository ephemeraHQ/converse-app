import { invalidateGroupMembersQuery } from "@queries/useGroupMembersQuery";
import { setGroupNameQueryData } from "@queries/useGroupNameQuery";
import { setGroupPhotoQueryData } from "@queries/useGroupPhotoQuery";
import {
  updateGroupNameToConversationListQuery,
  updateGroupImageToConversationListQuery,
  updateGroupDescriptionToConversationListQuery,
} from "@queries/useV3ConversationListQuery";

import { handleGroupUpdatedMessage } from "./handleGroupUpdatedMessage";
import type { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

jest.mock("@queries/useGroupMembersQuery", () => ({
  invalidateGroupMembersQuery: jest.fn(),
}));

jest.mock("@utils/xmtpRN/conversations", () => ({
  refreshGroup: jest.fn().mockResolvedValue(""),
}));

jest.mock("@utils/xmtpRN/sync", () => ({
  getXmtpClient: jest.fn().mockResolvedValue({
    conversations: {
      streamAllMessages: jest.fn(() => {}),
      cancelStreamAllMessages: jest.fn(() => {}),
      cancelStream: jest.fn(() => {}),
    },
    exportKeyBundle: jest.fn(() => "keybundle"),
    canMessage: jest.fn(() => true),
  }),
}));

jest.mock("../../../utils/xmtpRN/client", () => ({
  DecodedMessageWithCodecsType: jest.fn(),
}));

jest.mock("@queries/useGroupNameQuery", () => ({
  setGroupNameQueryData: jest.fn(),
}));

jest.mock("@queries/useGroupPhotoQuery", () => ({
  setGroupPhotoQueryData: jest.fn(),
}));

jest.mock("@queries/useV3ConversationListQuery", () => ({
  updateGroupNameToConversationListQuery: jest.fn(),
  updateGroupImageToConversationListQuery: jest.fn(),
  updateGroupDescriptionToConversationListQuery: jest.fn(),
}));

describe("handleGroupUpdatedMessage", () => {
  const account = "testAccount";
  const topic = "testTopic" as ConversationTopic;

  const createMessage = (contentTypeId: string, content: any) =>
    ({
      contentTypeId,
      content: () => content,
    }) as unknown as DecodedMessageWithCodecsType;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not proceed if contentTypeId does not include "group_updated"', async () => {
    const message = createMessage("text", {});

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).not.toHaveBeenCalled();
    expect(setGroupNameQueryData).not.toHaveBeenCalled();
    expect(setGroupPhotoQueryData).not.toHaveBeenCalled();
    expect(updateGroupNameToConversationListQuery).not.toHaveBeenCalled();
    expect(updateGroupImageToConversationListQuery).not.toHaveBeenCalled();
    expect(
      updateGroupDescriptionToConversationListQuery
    ).not.toHaveBeenCalled();
  });

  it("should invalidate group members query if members are added or removed", async () => {
    const content = {
      membersAdded: ["member1"],
      membersRemoved: [],
      metadataFieldsChanged: [],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).toHaveBeenCalledWith(account, topic);
  });

  it("should invalidate group name query if group name is changed", async () => {
    const newGroupName = "New Group Name";
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [
        { fieldName: "group_name", newValue: newGroupName },
      ],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(setGroupNameQueryData).toHaveBeenCalledWith(
      account,
      topic,
      newGroupName
    );
    expect(updateGroupNameToConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      name: newGroupName,
    });
  });

  it("should invalidate group photo query if group photo is changed", async () => {
    const newGroupPhoto = "New Photo URL";

    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [
        { fieldName: "group_image_url_square", newValue: newGroupPhoto },
      ],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(setGroupPhotoQueryData).toHaveBeenCalledWith(
      account,
      topic,
      newGroupPhoto
    );
    expect(updateGroupImageToConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      image: newGroupPhoto,
    });
  });

  it("should invalidate all relevant queries if multiple changes occur", async () => {
    const newGroupName = "New Group Name";
    const newGroupPhoto = "New Photo URL";
    const content = {
      membersAdded: ["member1"],
      membersRemoved: ["member2"],
      metadataFieldsChanged: [
        { fieldName: "group_name", newValue: newGroupName },
        { fieldName: "group_image_url_square", newValue: newGroupPhoto },
      ],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).toHaveBeenCalledWith(account, topic);
    expect(setGroupNameQueryData).toHaveBeenCalledWith(
      account,
      topic,
      newGroupName
    );
    expect(setGroupPhotoQueryData).toHaveBeenCalledWith(
      account,
      topic,
      newGroupPhoto
    );
    expect(updateGroupNameToConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      name: newGroupName,
    });
  });

  it("should handle empty metadataFieldsChanged array", async () => {
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).toHaveBeenCalled();
    expect(setGroupNameQueryData).not.toHaveBeenCalled();
    expect(setGroupPhotoQueryData).not.toHaveBeenCalled();
    expect(updateGroupNameToConversationListQuery).not.toHaveBeenCalled();
    expect(updateGroupImageToConversationListQuery).not.toHaveBeenCalled();
    expect(
      updateGroupDescriptionToConversationListQuery
    ).not.toHaveBeenCalled();
  });
});
