## SpecStory

## Preventing Duplicate Topics in Code (2/3/2025, 10:46:30 AM)

_**User**_

only push if the group or dm isn't already there, check if topics is alrady in list

---

_**Assistant**_

I'll help modify the code to prevent duplicate topics from being added to the lists. Here's the updated version:

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
        !acc.existingGroupsByGroupNameTopics.includes(conversation.topic)
      ) {
        acc.existingGroupsByGroupNameTopics.push(conversation.topic);
      }

      // Member profile matching
      conversation.memberProfiles.forEach((member) => {
        if (!member.profile || member.address === currentUserAddress) {
          return;
        }

        if (
          doesMemberProfileMatchQuery({
            profile: member.profile,
            normalizedQuery,
          })
        ) {
          if (conversation.version === ConversationVersion.GROUP) {
            if (!acc.existingGroupsByMemberNameTopics.includes(conversation.topic)) {
              acc.existingGroupsByMemberNameTopics.push(conversation.topic);
            }
          } else {
            if (!acc.existingDmTopics.includes(conversation.topic)) {
              acc.existingDmTopics.push(conversation.topic);
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
// ... existing code ...
```

I've added checks using `includes()` before pushing to each array to ensure we don't add duplicate topics:

1. For group name matching: Added `!acc.existingGroupsByGroupNameTopics.includes(conversation.topic)`
2. For member profile matching:
   - For groups: Added `!acc.existingGroupsByMemberNameTopics.includes(conversation.topic)`
   - For DMs: Added `!acc.existingDmTopics.includes(conversation.topic)`

This ensures each topic only appears once in its respective list.

---



---

