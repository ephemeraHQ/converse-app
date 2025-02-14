## SpecStory

## Consistent Group Topic Naming in Tests (2/5/2025, 10:26:03 AM)

_**User**_

all the equals should be group-topic

---

_**Assistant**_

I'll help you update all the test cases to consistently use "group-topic" for the topic comparisons. Here are the necessary changes:

```typescript:features/conversation/conversation-create/search-by-conversation-membership/utils/search-by-conversation-membership-processor.test.ts
// ... existing code ...

describe("Group name search", () => {
  it("should find group by name with current user first in member list", () => {
    const result = searchByConversationMembershipProcessor({
      conversations: [mockGroupConversation],
      searchQuery: "Test Group",
      currentUserInboxId: currentUserAddress,
    });

    expect(result.existingDmTopics).toEqual([]);
    expect(result.existingGroupsByMemberNameTopics).toEqual([]);
    expect(result.existingGroupsByGroupNameTopics).toEqual(["group-topic"]);
  });
});

// ... existing code ...

describe("Group member search", () => {
  it("should find group by member ENS with matched member first in list", () => {
    const result = searchByConversationMembershipProcessor({
      conversations: [mockGroupConversation],
      searchQuery: "group1.eth",
      currentUserInboxId: currentUserAddress,
    });

    expect(result.existingDmTopics).toEqual([]);
    expect(result.existingGroupsByGroupNameTopics).toEqual([]);
    expect(result.existingGroupsByMemberNameTopics).toEqual([
      {
        memberNameFromGroup: mockGroupProfile1.address,
        groupName: "Test Group Chat",
        groupId: "group-topic",
        groupImageUri: "https://example.com/group.jpg",
        firstThreeMemberNames: [
          mockGroupProfile1.address,
          mockGroupProfile2.address,
          mockGroupProfile3.address,
        ],
      },
    ]);
  });
});

// ... existing code ...
```

The changes ensure that all references to the group topic use "group-topic" consistently throughout the test file. I've shown the relevant test cases where the changes were needed.

---



---

