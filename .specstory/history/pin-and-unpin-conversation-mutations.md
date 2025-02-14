## SpecStory

## Pin and Unpin Conversation Mutations (1/17/2025, 6:10:40 AM)

_**User**_

separet teh 2 mutations into 2. I want pinMutation and unPinMutation and a usecallback that will be pinOrUnpinConversationAsync and that will check which one to call

---

_**Assistant**_

I'll help you separate the mutations and create a useCallback for the pin/unpin logic. Here's how to modify the code:

```typescript:features/conversation-list/hooks/use-pin-or-unpin-conversation.tsx
import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { pinTopic, unpinTopic } from "@/utils/api/topics";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export function usePinOrUnpinConversation(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const { mutateAsync: pinConversationAsync } = useMutation({
    mutationFn: () => {
      const currentAccount = getCurrentAccount()!;
      return pinTopic({
        account: currentAccount,
        topic: conversationTopic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousIsPinned = getConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
      })?.isPinned;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: true },
      });

      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: context?.previousIsPinned },
      });
    },
  });

  const { mutateAsync: unpinConversationAsync } = useMutation({
    mutationFn: () => {
      const currentAccount = getCurrentAccount()!;
      return unpinTopic({
        account: currentAccount,
        topic: conversationTopic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousIsPinned = getConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
      })?.isPinned;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: false },
      });

      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: context?.previousIsPinned },
      });
    },
  });

  const pinOrUnpinConversationAsync = useCallback(async () => {
    const currentAccount = getCurrentAccount()!;
    const isPinned = getConversationMetadataQueryData({
      account: currentAccount,
      topic: conversationTopic,
    })?.isPinned;

    if (isPinned) {
      return unpinConversationAsync();
    } else {
      return pinConversationAsync();
    }
  }, [conversationTopic, pinConversationAsync, unpinConversationAsync]);

  return {
    pinOrUnpinConversationAsync,
  };
}
```

Key changes made:
1. Separated the single mutation into two distinct mutations: `pinConversationAsync` and `unpinConversationAsync`
2. Each mutation now has its specific logic for pin/unpin
3. Created a useCallback that checks the current pin status and calls the appropriate mutation
4. Removed console.logs and simplified the code
5. The onMutate handlers now set specific boolean values instead of toggling
6. Maintained the same public API by returning `pinOrUnpinConversationAsync`

The code is now more maintainable and each mutation handles its specific case, making it easier to debug and modify in the future.

---



---

