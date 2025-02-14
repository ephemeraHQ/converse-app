## SpecStory

## Refining Group Query for Type Safety (12/16/2024, 11:10:47 AM)

_**User**_

it's using useConversationQuery but a conversation can be either a Group or DM, for useGroupQuery I want to say thatthe type is a Group

---

_**Assistant**_

I'll help you modify the `useGroupQuery` to properly type it for Groups. Here's how we can update it:

```typescript:queries/useGroupQuery.ts
import { useQuery } from "@tanstack/react-query";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { getGroupByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";

export function useGroupQuery(args: { 
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  return useQuery({
    queryKey: conversationQueryKey(account, topic),
    queryFn: async () => {
      if (!topic) {
        return null;
      }
      return getGroupByTopicByAccount({
        account,
        topic,
      });
    },
    enabled: !!topic,
  });
}
```

Key changes made:
1. Removed the commented-out code since it's no longer needed
2. Removed the dependency on `useConversationQuery` since we want this to be specifically for Groups
3. The query now returns `GroupWithCodecsType | null` instead of any conversation type
4. Restructured the arguments to use an object pattern following your preferred style
5. Removed the unused `includeSync` parameter since it wasn't being used in the commented code

This hook is now specifically typed for Groups and will make it clearer in the codebase when you're querying for a Group vs a general Conversation.

---



---

