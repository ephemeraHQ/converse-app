## SpecStory

## Reusing ConversationQueryData in Code (12/17/2024, 9:35:05 AM)

_**User**_

can we reuse ConversationQueryData from @useConversationQuery.ts instead? 

---

_**Assistant**_

Yes, we can reuse the `ConversationQueryData` type from `useConversationQuery.ts`. Here's how to update the `useGroupQuery.ts` file:

```typescript:queries/useGroupQuery.ts
import { getConversationQueryData, useConversationQuery, ConversationQueryData } from "@/queries/useConversationQuery";
import { UseQueryResult } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export function useGroupQuery(
  account: string, 
  topic: ConversationTopic
): UseQueryResult<ConversationQueryData> {
  return useConversationQuery(account, topic);
}

export function getGroupQueryData(
  account: string,
  topic: ConversationTopic
): ConversationQueryData {
  return getConversationQueryData(account, topic);
}
```

Key changes made:
1. Added `ConversationQueryData` to the imports
2. Removed the `GroupWithCodecsType` import as it's no longer needed
3. Updated return types to use `ConversationQueryData`
4. Removed unnecessary type assertions since we're now using the same type

This makes the code more maintainable by reusing types and removing redundant type casting.

---

_**User**_

but here's the type type ConversationQueryData = Group<SupportedCodecsType> | Dm<SupportedCodecsType>

Possible to say that in useGroupQuery we want to force using the Group one?

---

_**Assistant**_



Yes! We can use TypeScript's type narrowing to ensure `useGroupQuery` only returns the Group type. Here's how to update the file:

```typescript:queries/useGroupQuery.ts
import { getConversationQueryData, useConversationQuery, ConversationQueryData } from "@/queries/useConversationQuery";
import { UseQueryResult } from "@tanstack/react-query";
import { Group, SupportedCodecsType } from "@utils/xmtpRN/client";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export function useGroupQuery(
  account: string, 
  topic: ConversationTopic
): UseQueryResult<Group<SupportedCodecsType> | null | undefined> {
  const query = useConversationQuery(account, topic);
  
  return {
    ...query,
    data: query.data && 'groupMembers' in query.data ? query.data : null
  } as UseQueryResult<Group<SupportedCodecsType> | null | undefined>;
}

export function getGroupQueryData(
  account: string,
  topic: ConversationTopic
): Group<SupportedCodecsType> | null | undefined {
  const data = getConversationQueryData(account, topic);
  return data && 'groupMembers' in data ? data : null;
}
```

Key changes:
1. Added type narrowing by checking if `groupMembers` property exists (which is unique to Group type)
2. Updated return types to specifically use `Group<SupportedCodecsType>`
3. Added runtime checks to ensure we only return Group data

This way, we maintain type safety and ensure that these functions only work with Group conversations.

---



---

