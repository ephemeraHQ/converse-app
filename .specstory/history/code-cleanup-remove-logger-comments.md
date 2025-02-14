## SpecStory

## Code Cleanup: Remove Logger Comments (2/3/2025, 10:12:55 AM)

_**User**_

remove logger comments

---

_**Assistant**_

I'll help remove the commented-out logger statements while preserving the important documentation comment. Here's the simplified edit:

```typescript:features/search/search-by-conversation-membership/utils/search-by-conversation-membership-processor.ts
// ... existing code ...

export function searchByConversationMembershipProcessor(args: {
  conversations: SearchableConversation[];
  searchQuery: string;
  currentUserAddress: string;
}): SearchResults {
  const { conversations, searchQuery, currentUserAddress } = args;

  const normalizedQuery = searchQuery.toLowerCase();

  // ... existing code until the reduce function ...

  return conversations.reduce<SearchResults>(
    (acc, conversation) => {
      // Group name matching
      if (
        doesGroupNameMatchQuery(
          conversation.conversationName,
          normalizedQuery
        ) &&
        !conversation.conversationName?.includes("/proto")
      ) {
        const otherMembers = conversation.memberProfiles
          .filter((m) => m.address !== currentUserAddress)
          .slice(0, 2)
          .map((m) => getReadableProfile(m.address));

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
            acc.existingGroupsByMemberNameTopics.push(conversation.topic);
          } else {
            acc.existingDmTopics.push(conversation.topic);
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
}
```

I've removed all the commented-out logger statements while keeping the active logger.info call for the current user match case and preserving the important documentation comment at the top of the file. The core functionality remains unchanged.

---



---

