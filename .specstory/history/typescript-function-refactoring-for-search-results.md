## SpecStory

## TypeScript Function Refactoring for Search Results (2/3/2025, 10:10:28 AM)

_**User**_

fix to use 

---

_**Assistant**_

I'll help you modify the code to match the types from `search-by-conversation-membership.types.ts`. The current implementation is returning different data structures than what's defined in the types. Let me show you the necessary changes.

```typescript:features/search/search-by-conversation-membership/utils/search-by-conversation-membership-processor.ts
// ... existing code ...

export function searchByConversationMembershipProcessor(args: {
  conversations: SearchableConversation[];
  searchQuery: string;
  currentUserAddress: string;
}): SearchResults {
  const { conversations, searchQuery, currentUserAddress } = args;

  const normalizedQuery = searchQuery.toLowerCase();

  // ... existing code for current user profile check ...

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

The main changes made:
1. Simplified the return values to only include the conversation topics (strings) instead of the complex objects with member names and group details
2. Removed the member name formatting and ordering logic since we're now just storing the conversation topics
3. Maintained the same search logic but simplified the data storage

This change makes the implementation match the type definition where each array in `SearchResults` contains just the conversation topics.

Let me know if you need any clarification or have a different requirement in mind!

---



---

