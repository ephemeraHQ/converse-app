## SpecStory

## Fixing TypeScript Code with Inspiration (2/7/2025, 10:09:00 AM)

_**User**_

fix and check in @search-existing-dms.ts  for inspiration

---

_**Assistant**_

I'll help fix the linter errors in `search-existing-groups-by-group-members.ts` by taking inspiration from `search-existing-dms.ts`. Here are the changes needed:

```typescript:features/conversation/conversation-create/utils/search-conversations/search-existing-groups-by-group-members.ts
// ... existing imports ...
import { getSearchGroupsByMembersQueryKey } from "@/queries/QueryKeys"; // Updated import
import { doesSocialsMatchQuery } from "./search-conversations.helpers"; // Add helper
import { ConversationTopic } from "@xmtp/react-native-sdk"; // Add type
import { normalizeString } from "@/utils/str"; // Add normalize helper

export async function searchExistingGroupsByGroupMembers(args: {
  searchQuery: string;
}) {
  const { searchQuery } = args;
  const currentAccount = getCurrentAccount()!;
  const conversations = await getAllowedConsentConversationsQueryData({
    account: currentAccount,
  });
  const normalizedSearchQuery = normalizeString(searchQuery);

  if (!conversations || !normalizedSearchQuery) {
    return [];
  }

  const matchingTopics: ConversationTopic[] = [];

  // ... existing code until socials check ...

      if (!socials) {
        continue;
      }

      const hasMatch = doesSocialsMatchQuery({
        socials,
        normalizedQuery: normalizedSearchQuery,
      });

      if (hasMatch) {
        matchingTopics.push(conversation.topic);
        break;
      }
    }
  }

  return matchingTopics;
}

export function getSearchExistingGroupsByGroupMembersQueryOptions(args: {
  searchQuery: string;
}) {
  const normalizedSearchQuery = normalizeString(args.searchQuery);
  return queryOptions({
    queryKey: getSearchGroupsByMembersQueryKey({ searchQuery: normalizedSearchQuery }),
    queryFn: () => searchExistingGroupsByGroupMembers(args),
    enabled: !!args.searchQuery,
    staleTime: 0,
  });
}

// ... rest of the file remains the same ...
```

The main changes are:

1. Fixed the import for the query key - changed to `getSearchGroupsByMembersQueryKey` (you'll need to ensure this exists in QueryKeys.ts)
2. Added the `doesSocialsMatchQuery` helper function which is already being used in search-existing-dms.ts
3. Added proper typing with `ConversationTopic` from the SDK
4. Used the `normalizeString` helper for consistent string normalization
5. Replaced the manual socials check with the helper function that's already tested and used in the DMs search

You'll need to make sure the following exists in `QueryKeys.ts`:

```typescript:queries/QueryKeys.ts
export function getSearchGroupsByMembersQueryKey(args: { searchQuery: string }) {
  return ["search-groups-by-members", args.searchQuery];
}
```

These changes will resolve the linter errors while making the code more consistent with the existing DMs search implementation.

---

_**User**_



---

_**Assistant**_

Looking at the files, I notice we should make one more improvement to maintain consistency with the query key pattern in the codebase. Let's update the query key to follow the same pattern as other search-related keys:

```typescript:queries/QueryKeys.ts
// Update the query key to follow the pattern
export const getSearchGroupsByMembersQueryKey = (args: { searchQuery: string }) => [
  QueryKeys.CONVERSATIONS_SEARCH,
  "groups-by-members",
  args.searchQuery,
];
```

And let's update the corresponding import and usage in the search file:

```typescript:features/conversation/conversation-create/utils/search-conversations/search-existing-groups-by-group-members.ts
// ... existing imports remain the same ...

export function getSearchExistingGroupsByGroupMembersQueryOptions(args: {
  searchQuery: string;
}) {
  const normalizedSearchQuery = normalizeString(args.searchQuery);
  return queryOptions({
    queryKey: getSearchGroupsByMembersQueryKey({ 
      searchQuery: normalizedSearchQuery 
    }),
    queryFn: () => searchExistingGroupsByGroupMembers(args),
    enabled: !!args.searchQuery,
    staleTime: 0,
  });
}
```

This change:
1. Makes the query key consistent with other search-related keys in the codebase
2. Uses the `QueryKeys.CONVERSATIONS_SEARCH` enum value like other similar queries
3. Follows the pattern of having a descriptive segment ("groups-by-members") to identify the specific search type

The rest of the code looks good with the previous changes we made.

---



---

