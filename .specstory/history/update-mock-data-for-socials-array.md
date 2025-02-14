## SpecStory

## Update Mock Data for Socials Array (2/5/2025, 10:05:45 AM)

_**User**_

transfomr into socials[] like the mock stuff . to fix

---

_**Assistant**_

I'll help you update the test file to use `socials` array instead of `profile` in the mock data. Here are the necessary changes:

```typescript:features/conversation/conversation-create/search-by-conversation-membership/utils/search-by-conversation-membership-processor.test.ts
// ... existing code ...

  const mockDmConversation: SearchableConversation = {
    version: ConversationVersion.DM,
    topic: "dm-topic" as ConversationTopic,
    memberProfiles: [
      { inboxId: currentUserAddress, socials: [] },
      { inboxId: "0xDmUser", socials: [mockDmProfile] },
    ],
  };

  const mockGroupConversation: SearchableConversation = {
    version: ConversationVersion.GROUP,
    topic: "group-topic" as ConversationTopic,
    conversationName: "Test Group Chat",
    conversationImageUri: "https://example.com/group.jpg",
    memberProfiles: [
      { inboxId: currentUserAddress, socials: [] },
      { inboxId: "0xGroupUser1", socials: [mockGroupProfile1] },
      { inboxId: "0xGroupUser2", socials: [mockGroupProfile2] },
      { inboxId: "0xGroupUser3", socials: [mockGroupProfile3] },
    ],
  };

// ... existing code ...

      const conversationWithCurrentUser: SearchableConversation = {
        ...mockDmConversation,
        memberProfiles: [
          { inboxId: currentUserAddress, socials: [currentUserProfile] },
          { inboxId: "0xDmUser", socials: [mockDmProfile] },
        ],
      };

// ... existing code ...

      const largeGroup: SearchableConversation = {
        ...mockGroupConversation,
        memberProfiles: [
          { inboxId: currentUserAddress, socials: [] },
          { inboxId: "0xGroupUser1", socials: [mockGroupProfile1] },
          { inboxId: "0xGroupUser2", socials: [mockGroupProfile2] },
          { inboxId: "0xGroupUser3", socials: [mockGroupProfile3] },
          {
            inboxId: "0xGroupUser4",
            socials: [{ ...mockGroupProfile1, address: "0xGroupUser4" }],
          },
        ],
      };

// ... existing code ...
```

The changes replace all instances of `profile: someProfile` with `socials: [someProfile]` in the mock data. For cases where there was `profile: null`, it's replaced with `socials: []`. This maintains the array structure for the socials field while keeping the same test logic.

---



---

