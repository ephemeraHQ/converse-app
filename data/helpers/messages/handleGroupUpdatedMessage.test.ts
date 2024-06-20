import { invalidateGroupMembersQuery } from "../../../queries/useGroupMembersQuery";
import { invalidateGroupNameQuery } from "../../../queries/useGroupNameQuery";
import { invalidateGroupPhotoQuery } from "../../../queries/useGroupPhotoQuery";
import { DecodedMessageWithCodecsType } from "../../../utils/xmtpRN/client";
import { handleGroupUpdatedMessage } from "./handleGroupUpdatedMessage";

jest.mock("../../../queries/useGroupMembersQuery", () => ({
  invalidateGroupMembersQuery: jest.fn(),
}));

jest.mock("../../../queries/useGroupNameQuery", () => ({
  invalidateGroupNameQuery: jest.fn(),
}));

jest.mock("../../../queries/useGroupPhotoQuery", () => ({
  invalidateGroupPhotoQuery: jest.fn(),
}));

describe("handleGroupUpdatedMessage", () => {
  const account = "testAccount";
  const topic = "testTopic";

  const createMessage = (contentTypeId: string, content: any) =>
    ({
      contentTypeId,
      content: () => content,
    }) as unknown as DecodedMessageWithCodecsType;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not proceed if contentTypeId does not include "group_updated"', () => {
    const message = createMessage("text", {});

    handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).not.toHaveBeenCalled();
    expect(invalidateGroupNameQuery).not.toHaveBeenCalled();
    expect(invalidateGroupPhotoQuery).not.toHaveBeenCalled();
  });

  it("should invalidate group members query if members are added or removed", () => {
    const content = {
      membersAdded: ["member1"],
      membersRemoved: [],
      metadataFieldsChanged: [],
    };
    const message = createMessage("group_updated", content);

    handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).toHaveBeenCalledWith(account, topic);
  });

  it("should invalidate group name query if group name is changed", () => {
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [
        { fieldName: "group_name", newValue: "New Group Name" },
      ],
    };
    const message = createMessage("group_updated", content);

    handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupNameQuery).toHaveBeenCalledWith(account, topic);
  });

  it("should invalidate group photo query if group photo is changed", () => {
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [
        { fieldName: "group_image_url_square", newValue: "New Photo URL" },
      ],
    };
    const message = createMessage("group_updated", content);

    handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupPhotoQuery).toHaveBeenCalledWith(account, topic);
  });

  it("should invalidate all relevant queries if multiple changes occur", () => {
    const content = {
      membersAdded: ["member1"],
      membersRemoved: ["member2"],
      metadataFieldsChanged: [
        { fieldName: "group_name", newValue: "New Group Name" },
        { fieldName: "group_image_url_square", newValue: "New Photo URL" },
      ],
    };
    const message = createMessage("group_updated", content);

    handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).toHaveBeenCalledWith(account, topic);
    expect(invalidateGroupNameQuery).toHaveBeenCalledWith(account, topic);
    expect(invalidateGroupPhotoQuery).toHaveBeenCalledWith(account, topic);
  });

  it("should handle empty metadataFieldsChanged array", () => {
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [],
    };
    const message = createMessage("group_updated", content);

    handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).toHaveBeenCalled();
    expect(invalidateGroupNameQuery).not.toHaveBeenCalled();
    expect(invalidateGroupPhotoQuery).not.toHaveBeenCalled();
  });
});
