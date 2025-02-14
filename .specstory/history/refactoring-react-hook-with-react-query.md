## SpecStory

## Refactoring React Hook with React Query (1/13/2025, 9:44:28 AM)

_**User**_

clean and useQuery instead

---

_**Assistant**_

I'll help you refactor this code to use React Query and clean it up according to the style guide. Here are the key changes:

1. Replace useState/useEffect with useQuery
2. Clean up the types
3. Improve error handling
4. Make the code more functional

```typescript:hooks/use-current-account-group-members-info.ts
import logger from "@/utils/logger";
import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client.types";
import { type InboxId } from "@xmtp/react-native-sdk";
import { useQuery } from "@tanstack/react-query";

type IMemberInfo = {
  inboxId: InboxId;
  address: string;
  uri: string | undefined;
  name: string;
};

export function useCurrentAccountGroupMembersInfo(args: {
  currentAccount: string;
  group?: GroupWithCodecsType;
}) {
  const { currentAccount, group } = args;

  const { data: members = [] } = useQuery({
    queryKey: ["group-members", group?.id],
    queryFn: async () => {
      if (!group?.members || typeof group.members !== "function") {
        logger.error("Invalid group members function");
        return [];
      }
      return group.members();
    },
    enabled: Boolean(group) && !group?.imageUrlSquare,
  });

  const memberInboxIds = members.map((member) => member.inboxId);
  const socialsData = useInboxProfileSocialsQueries(currentAccount, memberInboxIds);

  const memberData = socialsData
    .map(
      ({ data: socials }, index): IMemberInfo | null =>
        socials
          ? {
              inboxId: memberInboxIds[index],
              address: getPreferredInboxAddress(socials) ?? "",
              uri: getPreferredInboxAvatar(socials),
              name: getPreferredInboxName(socials),
            }
          : null
    )
    .filter(Boolean) as IMemberInfo[];

  return {
    memberData,
    imageUrlSquare: group?.imageUrlSquare,
  };
}
```

Key changes made:
- Replaced useState/useEffect with useQuery for better caching and loading states
- Added proper type for member info (IMemberInfo)
- Improved error handling in the queryFn
- Made the function take an object parameter following the style guide
- Simplified the memberData transformation using more functional patterns
- Removed unnecessary useMemo calls since React Query handles memoization
- Added proper enabled condition for the query

The hook now has better caching, loading states, and error handling while being more maintainable and type-safe.

---

_**User**_

use useGroupMembersQuery in @useGroupMembersQuery.ts 

---

_**Assistant**_

I'll help you refactor the `useCurrentAccountGroupMembersInfo` hook to use the existing `useGroupMembersQuery`. Here's the updated version:

```typescript:hooks/use-current-account-group-members-info.ts
import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import { useGroupMembersQuery } from "@queries/useGroupMembersQuery";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client.types";
import { type InboxId } from "@xmtp/react-native-sdk";

type IMemberInfo = {
  inboxId: InboxId;
  address: string;
  uri: string | undefined;
  name: string;
};

export function useCurrentAccountGroupMembersInfo(args: {
  currentAccount: string;
  group?: GroupWithCodecsType;
}) {
  const { currentAccount, group } = args;

  const { data: membersData } = useGroupMembersQuery({
    account: currentAccount,
    topic: group?.topic!,
    queryOptions: {
      enabled: Boolean(group?.topic) && !group?.imageUrlSquare,
    },
  });

  const memberInboxIds = membersData?.ids ?? [];
  const socialsData = useInboxProfileSocialsQueries(currentAccount, memberInboxIds);

  const memberData = socialsData
    .map(
      ({ data: socials }, index): IMemberInfo | null =>
        socials
          ? {
              inboxId: memberInboxIds[index],
              address: getPreferredInboxAddress(socials) ?? "",
              uri: getPreferredInboxAvatar(socials),
              name: getPreferredInboxName(socials),
            }
          : null
    )
    .filter(Boolean) as IMemberInfo[];

  return {
    memberData,
    imageUrlSquare: group?.imageUrlSquare,
  };
}
```

Key changes made:
- Replaced the custom members fetching logic with `useGroupMembersQuery`
- Used the `ids` array from the query response to get member IDs
- Removed unnecessary error logging since the query handles errors
- Maintained the same return type and structure
- Added proper query enabling conditions
- Removed direct group.members() call since it's now handled by the query

The hook is now more consistent with the rest of the codebase by using the existing query infrastructure while maintaining the same functionality.

---



---

