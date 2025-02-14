## SpecStory

## Fixing TypeScript Typing Structure for Search (2/4/2025, 1:15:41 PM)

_**User**_

fix to use correct typing structure check @search-by-conversation-membership @search-by-conversation-membership.types.ts 

---

_**Assistant**_

Looking at the tests and types, I notice there's a mismatch between the expected return types and what's being used in the processor. Let me help fix the typing structure.

```typescript:features/search/search-by-conversation-membership/utils/search-by-conversation-membership.types.ts
// ... existing code ...

export type SearchResults = {
  existingDmTopics: IProfileSocials[];
  existingGroupsByMemberNameTopics: {
    memberNameFromGroup: string;
    groupName: string;
    groupId: ConversationTopic;
    groupImageUri?: string;
    firstThreeMemberNames: string[];
  }[];
  existingGroupsByGroupNameTopics: {
    groupName: string;
    groupId: ConversationTopic;
    groupImageUri?: string;
    firstThreeMemberNames: string[];
  }[];
};
```

Now let's update the processor to match these types:

```typescript:features/search/search-by-conversation-membership/utils/search-by-conversation-membership-processor.ts
// ... existing code ...

return conversations.reduce<SearchResults>(
  (acc, conversation) => {
    // Group name matching
    if (
      doesGroupNameMatchQuery(
        conversation.conversationName,
        normalizedQuery
      ) &&
      !conversation.conversationName?.includes("/proto") &&
      !acc.existingGroupsByGroupNameTopics.some(g => g.groupId === conversation.topic)
    ) {
      acc.existingGroupsByGroupNameTopics.push({
        groupName: conversation.conversationName!,
        groupId: conversation.topic,
        groupImageUri: conversation.conversationImageUri,
        firstThreeMemberNames: conversation.memberProfiles
          .slice(0, 3)
          .map(member => member.inboxId)
      });
    }

    // Member profile matching
    conversation.memberProfiles.forEach((member) => {
      if (!member.socials || member.inboxId === currentUserInboxId) {
        return;
      }

      if (
        doesMemberProfileMatchQuery({
          profile: member.socials,
          normalizedQuery,
        })
      ) {
        if (conversation.version === ConversationVersion.GROUP) {
          if (
            !acc.existingGroupsByMemberNameTopics.some(g => g.groupId === conversation.topic)
          ) {
            acc.existingGroupsByMemberNameTopics.push({
              memberNameFromGroup: member.inboxId,
              groupName: conversation.conversationName!,
              groupId: conversation.topic,
              groupImageUri: conversation.conversationImageUri,
              firstThreeMemberNames: conversation.memberProfiles
                .slice(0, 3)
                .map(m => m.inboxId)
            });
          }
        } else {
          if (!acc.existingDmTopics.some(dm => dm.address === member.socials[0].address)) {
            acc.existingDmTopics.push(member.socials[0]);
          }
        }
      }
    });

    return acc;
  },
  {
    existingDmTopics: [],
    existingGroupsByMemberNameTopics: [],
    existingGroupsByGroupNameTopics: [],
  }
);
```

The key changes are:

1. Updated `SearchResults` type to match what's being used in the tests
2. Changed the return structure in the processor to match the expected types:
   - `existingDmTopics` now stores `IProfileSocials[]` instead of just topics
   - Added proper group result objects with member names and metadata
   - Added proper type checking to prevent duplicates
3. Fixed the member profile handling to store the full profile socials for DMs
4. Added proper group metadata (name, image, member names) to group results

These changes align the types with how they're being used in the tests and provide more complete information for the UI to display.

---



---

