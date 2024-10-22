import { invalidateGroupMembersQuery } from "@queries/useGroupMembersQuery";
import { invalidateGroupNameQuery } from "@queries/useGroupNameQuery";
import { invalidateGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client.types";

import { handleGroupUpdatedMessage } from "./handleGroupUpdatedMessage";
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
  invalidateGroupNameQuery: jest.fn(),
}));

jest.mock("@queries/useGroupPhotoQuery", () => ({
  invalidateGroupPhotoQuery: jest.fn(),
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
    expect(invalidateGroupNameQuery).not.toHaveBeenCalled();
    expect(invalidateGroupPhotoQuery).not.toHaveBeenCalled();
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
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [
        { fieldName: "group_name", newValue: "New Group Name" },
      ],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupNameQuery).toHaveBeenCalledWith(account, topic);
  });

  it("should invalidate group photo query if group photo is changed", async () => {
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [
        { fieldName: "group_image_url_square", newValue: "New Photo URL" },
      ],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupPhotoQuery).toHaveBeenCalledWith(account, topic);
  });

  it("should invalidate all relevant queries if multiple changes occur", async () => {
    const content = {
      membersAdded: ["member1"],
      membersRemoved: ["member2"],
      metadataFieldsChanged: [
        { fieldName: "group_name", newValue: "New Group Name" },
        { fieldName: "group_image_url_square", newValue: "New Photo URL" },
      ],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).toHaveBeenCalledWith(account, topic);
    expect(invalidateGroupNameQuery).toHaveBeenCalledWith(account, topic);
    expect(invalidateGroupPhotoQuery).toHaveBeenCalledWith(account, topic);
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
    expect(invalidateGroupNameQuery).not.toHaveBeenCalled();
    expect(invalidateGroupPhotoQuery).not.toHaveBeenCalled();
  });
});
