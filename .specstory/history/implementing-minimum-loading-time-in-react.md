## SpecStory

## Implementing Minimum Loading Time in React (1/29/2025, 3:41:02 PM)

_**User**_

i want to make sure that if "isLoadingConversations" is true , it's stays true for at least 3 seconds 

---

_**Assistant**_

I'll help you add a minimum loading time of 3 seconds. We can create a custom hook to handle this logic. Here's how to modify the code:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
import React, { memo, useCallback, useEffect, useState } from "react";
// ... existing code ...

// Add this custom hook before the ConversationListScreen component
function useMinimumLoadingTime(isLoading: boolean, minimumTime: number) {
  const [isMinLoadingComplete, setIsMinLoadingComplete] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsMinLoadingComplete(false);
      const timer = setTimeout(() => {
        setIsMinLoadingComplete(true);
      }, minimumTime);
      return () => clearTimeout(timer);
    }
  }, [isLoading, minimumTime]);

  return isLoading || !isMinLoadingComplete;
}

export function ConversationListScreen(props: IConversationListProps) {
  const {
    data: conversations,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
  } = useConversationListConversations();

  // Add this line to use the minimum loading time
  const isLoading = useMinimumLoadingTime(isLoadingConversations, 3000);

  // ... existing code ...

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      {isLoading ? ( // Replace isLoadingConversations with isLoading
        <ConversationListLoading />
      ) : (
        // ... existing code ...
      )}
    </Screen>
  );
}
// ... existing code ...
```

This modification:

1. Creates a new custom hook `useMinimumLoadingTime` that ensures the loading state remains true for at least the specified time (3000ms in this case)
2. Adds the necessary imports for `useEffect` and `useState`
3. Replaces the `isLoadingConversations` check with our new `isLoading` state that respects the minimum loading time

The loading screen will now show for at least 3 seconds, even if the actual loading completes faster than that. If the loading takes longer than 3 seconds, it will show until the actual loading completes.

---



---

