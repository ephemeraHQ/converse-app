## SpecStory

## Creating a Custom Hook for Group Consent (12/18/2024, 9:14:17 AM)

_**User**_

do like this where we derived from useGroupQuery and use group.state

import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCurrentAccount } from "../data/store/accountsStore";
import { useGroupPhotoMutation } from "../queries/useGroupPhotoMutation";
import { useGroupPhotoQuery } from "../queries/useGroupPhotoQuery";

export const useGroupPhoto = (topic: ConversationTopic) => {
  const account = useCurrentAccount();
  const { data, isLoading, isError } = useGroupPhotoQuery({
    account: account ?? "",
    topic,
  });
  const { mutateAsync } = useGroupPhotoMutation({
    account: account ?? "",
    topic,
  });

  return {
    groupPhoto: data,
    isLoading,
    isError,
    setGroupPhoto: mutateAsync,
  };
};


---

_**Assistant**_

I'll help you create a similar hook for the group consent functionality. Here's how we can refactor it:

```typescript:queries/useGroupConsent.ts
import type { ConsentState, ConversationTopic } from "@xmtp/react-native-sdk";
import { useCurrentAccount } from "../data/store/accountsStore";
import { useGroupConsentQuery } from "./useGroupConsentQuery";

export const useGroupConsent = (topic: ConversationTopic) => {
  const account = useCurrentAccount();
  const { data, isLoading, isError } = useGroupConsentQuery(
    account ?? "",
    topic
  );

  return {
    groupConsent: data,
    isLoading,
    isError,
  };
};
```

This refactored version:
1. Creates a new hook that follows the same pattern as `useGroupPhoto`
2. Uses the existing `useGroupConsentQuery` but simplifies the interface
3. Automatically handles the current account through `useCurrentAccount`
4. Returns a clean object with the consent state and loading/error states

You can use this hook like:

```typescript
const { groupConsent, isLoading, isError } = useGroupConsent(topic);
```

Note that I didn't include a mutation function like `setGroupPhoto` since it wasn't clear if you needed one for consent. If you do need one, we can add that as well.

---

_**User**_

what no i want you to modife useGroupConsentQuery

---

_**Assistant**_

Ah, I apologize! You want to modify `useGroupConsentQuery` to derive from `useGroupQuery` similar to how `useGroupPhotoQuery` is structured. Here's the modification:

```typescript:queries/useGroupConsentQuery.ts
import { useGroupQuery } from "@queries/useGroupQuery";
import { QueryObserverOptions, useQuery } from "@tanstack/react-query";
import type { ConsentState, ConversationTopic } from "@xmtp/react-native-sdk";
import { groupConsentQueryKey } from "./QueryKeys";

type IGroupConsentQueryArgs = {
  account: string;
  topic: ConversationTopic;
  queryOptions?: Partial<QueryObserverOptions<ConsentState>>;
};

export const useGroupConsentQuery = (args: IGroupConsentQueryArgs) => {
  const { account, topic, queryOptions } = args;
  const { data: group } = useGroupQuery({ account, topic });

  return useQuery({
    queryKey: groupConsentQueryKey(account, topic),
    queryFn: async () => group?.state ?? null,
    enabled: !!group && !!topic,
    initialData: group?.state,
    ...queryOptions,
  });
};
```

Key changes made:
1. Restructured the parameters to use a single object argument pattern
2. Simplified the `queryFn` to directly use `group.state` instead of calling `consentState()`
3. Maintained the same functionality but with cleaner TypeScript patterns

The rest of the utility functions in the file can remain the same since they're still valid.

---



---

