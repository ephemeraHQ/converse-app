## SpecStory

## Optimizing React Hook Re-renders (1/13/2025, 3:49:19 PM)

_**User**_

problem is every time converastions. will renrender this hook will rerender i just want a reernder when the count change!

---

_**Assistant**_

I'll help you optimize the hook to only re-render when the actual count changes. We'll use `useMemo` to memoize the count value and ensure it only updates when the count actually changes.

Here's the updated code:

```typescript:features/conversation-list/hooks/use-conversations-count.ts
export const useConversationsCount = () => {
  const account = useCurrentAccount();

  const { data: conversations } = useConversationListQuery({
    account: account!,
    context: "useConversationsCount",
  });

  // Memoize the count value itself, not just the calculation
  const count = useMemo(() => {
    const currentCount = conversations?.length ?? 0;
    return currentCount;
  }, [conversations?.length]); // Only depend on the length, not the entire conversations array

  return count;
};
```

Key changes made:
1. Changed the dependency in `useMemo` to `conversations?.length` instead of the entire `conversations` array. This ensures the hook only re-renders when the actual count changes, not when the conversations array reference changes.
2. Memoized the count value itself rather than just the calculation.

This optimization will prevent unnecessary re-renders when the conversations array reference changes but the actual count remains the same.

---

_**User**_

no, use query observer and useState. Because even with what you suggest, the hook will rerender EVERY time the listQuery updates

---

_**Assistant**_

Ah yes, you're absolutely right! We can use `useQueryObserver` to only listen to specific changes and manage the count with `useState`. Here's the better solution:

```typescript:features/conversation-list/hooks/use-conversations-count.ts
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useCurrentAccount } from "@data/store/accountsStore";
import { conversationListQueryKey } from "@/queries/useConversationListQuery";

export const useConversationsCount = () => {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe({
      queryKey: conversationListQueryKey(account!, "useConversationsCount"),
      onChange: (query) => {
        const newCount = query.state.data?.length ?? 0;
        setCount(newCount);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [account, queryClient]);

  return count;
};
```

Key changes:
1. Removed direct query subscription and used `queryClient.getQueryCache().subscribe()` instead
2. Using `useState` to store and update the count only when it actually changes
3. The component using this hook will now only re-render when the count state actually changes, not on every query update

This approach is much more efficient as it:
- Only updates when the actual data changes
- Manages its own state independently of the query
- Properly cleans up the subscription when the hook unmounts

---



---

