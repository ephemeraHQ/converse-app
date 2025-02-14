## SpecStory

## Refactoring DM Handling with Topic Argument (1/20/2025, 8:46:01 PM)

_**User**_

refactor so that we pass args:{topic} instead and not dm. then we'll fetch the dm with useConversation to get the converastion.id for dm.id

---

_**Assistant**_

I'll help refactor the code to accept `topic` as an argument and use `useConversation` to fetch the DM data. Here's the modified version:

```typescript:features/conversation-list/hooks/use-delete-dm.ts
// ... existing code ...
import { useConversation } from "@/queries/use-conversation";

export const useDeleteDm = ({ topic }: { topic: string }) => {
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";

  const currentAccount = useCurrentAccount()!;

  const { data: conversation } = useConversation({
    account: currentAccount,
    topic,
  });

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount,
    topic,
  });

  const { mutateAsync: updateDmConsentAsync } = useDmConsent({
    peerInboxId: peerInboxId!,
    conversationId: conversation?.id,
    topic,
  });

  const preferredName = usePreferredInboxName(peerInboxId);

  const { mutateAsync: deleteDmAsync } = useMutation({
    mutationFn: () =>
      deleteTopic({
        account: currentAccount,
        topic,
      }),
    onMutate: () => {
      const previousIsDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      })?.isDeleted;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { isDeleted: true },
      });

      return { previousIsDeleted };
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { isDeleted: context?.previousIsDeleted },
      });
    },
  });

  // ... rest of the code remains the same ...
```

Key changes made:
1. Changed the function parameter to accept `{ topic }` instead of `dm`
2. Added `useConversation` hook to fetch the conversation data
3. Updated references from `dm.topic` to just `topic`
4. Updated `useDmConsent` to use `conversation?.id` instead of `dm.id`
5. Removed the `DmWithCodecsType` import since it's no longer needed

The rest of the function (the return useCallback part) remains unchanged since it doesn't directly use the dm object.

---



---

