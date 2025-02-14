## SpecStory

## Fixing Tests for New Messages Function (12/18/2024, 9:11:11 AM)

_**User**_

look at the new function in @messages.ts and fix the tests 

---

_**Assistant**_

I'll help you fix the tests to match the new implementation in `messages.ts`. The main change is that instead of using separate query functions for name, photo, and description updates, the code now uses a single `updateConversationInConversationListQuery` function.

Here are the necessary changes to the test file:

```typescript:data/helpers/messages/handleGroupUpdatedMessage.test.ts
// ... existing imports and mocks ...

// Replace these three mock imports with the single one
jest.mock("@queries/useConversationListQuery", () => ({
  updateConversationInConversationListQuery: jest.fn(),
}));

// Remove these mocks as they're no longer used
// jest.mock("@queries/useGroupNameQuery", ...);
// jest.mock("@queries/useGroupPhotoQuery", ...);

describe("handleGroupUpdatedMessage", () => {
  // ... existing setup code ...

  it('should not proceed if contentTypeId does not include "group_updated"', async () => {
    const message = createMessage("text", {});

    await handleGroupUpdatedMessage(account, topic, message);

    expect(invalidateGroupMembersQuery).not.toHaveBeenCalled();
    expect(updateConversationInConversationListQuery).not.toHaveBeenCalled();
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

  it("should update conversation list query if group name is changed", async () => {
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

    expect(updateConversationInConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      conversation: {
        name: newGroupName,
      },
    });
  });

  it("should update conversation list query if group photo is changed", async () => {
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

    expect(updateConversationInConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      conversation: {
        imageUrlSquare: newGroupPhoto,
      },
    });
  });

  it("should update conversation list query if group description is changed", async () => {
    const newDescription = "New Description";
    const content = {
      membersAdded: [],
      membersRemoved: [],
      metadataFieldsChanged: [
        { fieldName: "description", newValue: newDescription },
      ],
    };
    const message = createMessage("group_updated", content);

    await handleGroupUpdatedMessage(account, topic, message);

    expect(updateConversationInConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      conversation: {
        description: newDescription,
      },
    });
  });

  it("should update all relevant queries if multiple changes occur", async () => {
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
    expect(updateConversationInConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      conversation: {
        name: newGroupName,
      },
    });
    expect(updateConversationInConversationListQuery).toHaveBeenCalledWith({
      account,
      topic,
      conversation: {
        imageUrlSquare: newGroupPhoto,
      },
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
    expect(updateConversationInConversationListQuery).not.toHaveBeenCalled();
  });
});
```

Key changes made:
1. Removed unused mock imports for individual query functions
2. Updated mock for `useConversationListQuery` to only include `updateConversationInConversationListQuery`
3. Updated test cases to verify the new single update function is called with the correct parameters
4. Added a new test case for description updates
5. Updated the multiple changes test to verify separate calls to `updateConversationInConversationListQuery`
6. Updated expectations to match the new implementation's behavior

---



---

