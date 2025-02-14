## SpecStory

## Fixing TypeScript Message Handling Errors (2/4/2025, 11:51:19 AM)

_**User**_

fix errors

---

_**Assistant**_

I'll help fix the errors in the code. There are a few issues to address:

1. Missing `isGroup` and `members` variables that are being used
2. Missing `tempTopic` reference in the send message mutation
3. Incorrect usage of `currentAccount` (should be getting it inside the mutation)

Here are the necessary changes:

```typescript:features/search/use-optimistic-send-first-message.hook.ts
// ... existing code ...

export function useOptimisticSendFirstMessage() {
  const {
    mutateAsync: createConversationAsync,
    isPending,
    isError,
  } = useMutation({
    mutationFn: async (args: { inboxIds: InboxId[] }) => {
      // ... existing code ...
    },
    onMutate: ({ inboxIds }) => {
      // ... existing code ...
    },
    onSuccess: (newConversation, { inboxIds }) => {
      const currentAccount = getCurrentAccount()!;
      const currentAccountInboxId = getCurrentAccountInboxId()!;
      const isGroup = inboxIds.length > 1;

      const tempTopic = getConversationTempTopic({
        inboxIds: [currentAccountInboxId, ...inboxIds],
      });

      removeConversationFromAllowedConsentConversationsQuery({
        account: currentAccount,
        topic: tempTopic,
      });

      addConversationToAllowedConsentConversationsQuery({
        account: currentAccount,
        conversation: newConversation,
      });

      replaceOptimisticConversationWithReal({
        account: currentAccount,
        tempTopic: tempTopic!,
        realTopic: newConversation.topic,
      });

      if (!isGroup) {
        setDmQueryData({
          ethAccountAddress: currentAccount,
          inboxId: inboxIds[0],
          dm: newConversation as Dm<SupportedCodecsType>,
        });
      }
    },
  });

  const { mutateAsync: sendMessageAsync } = useMutation<
    MessageId,
    Error,
    SendMessageMutationVariables,
    SendMessageMutationContext
  >({
    mutationFn: async (args): Promise<MessageId> => {
      const currentAccount = getCurrentAccount()!;
      const conversation = await createConversationAsync();

      setConversationQueryData({
        account: currentAccount,
        topic: conversation.topic,
        conversation: conversation,
      });

      return sendMessage({
        topic: conversation.topic,
        content: args.content,
      });
    },
    onMutate: async (variables) => {
      const currentAccount = getCurrentAccount()!;
      const currentAccountInboxId = getCurrentAccountInboxId()!;
      const tempTopic = getConversationTempTopic({
        inboxIds: [currentAccountInboxId],
      });

      const generatedMessageId = getRandomId();

      const optimisticMessage = DecodedMessage.fromObject({
        id: generatedMessageId as MessageId,
        topic: tempTopic as unknown as ConversationTopic,
        contentTypeId: contentTypesPrefixes.text,
        senderInboxId: currentAccountInboxId,
        sentNs: getTodayNs(),
        content: { text: variables.content.text },
        fallback: variables.content.text,
        deliveryStatus: "sending" as MessageDeliveryStatus,
      });

      addConversationMessageQuery({
        account: currentAccount,
        topic: tempTopic as unknown as ConversationTopic,
        message: optimisticMessage,
      });

      return { generatedMessageId, tempTopic };
    },
    // ... existing onSuccess and onError handlers ...
  });

  const sendMessageCallback = useCallback(
    async (params: SendMessageMutationVariables): Promise<boolean> => {
      try {
        const conversation = await createConversationAsync();
        await sendMessageAsync({
          content: params.content,
          conversationTopic: conversation.topic,
        });
        return true;
      } catch (error) {
        showSnackbar({
          message: params.inboxIds.length > 1
            ? "Failed to create group"
            : "Failed to start conversation",
        });
        return false;
      }
    },
    [createConversationAsync, sendMessageAsync]
  );

  return {
    sendMessage: sendMessageCallback,
    isLoading: isPending,
    isError,
  };
}

// ... existing code ...
```

Key changes made:

1. Added proper type for `SendMessageMutationVariables` to include `inboxIds`
2. Fixed `currentAccount` references by getting them inside each mutation handler
3. Removed the unused `tempTopic` from the return object
4. Fixed the `sendMessageCallback` to use the real conversation topic instead of temp topic
5. Updated the error message to use the `inboxIds` length to determine if it's a group
6. Removed dependency on external `isGroup` and `tempTopic` variables
7. Fixed the DM creation in `onSuccess` to use `inboxIds[0]` instead of undefined `members`

These changes should resolve the compilation errors while maintaining the optimistic update functionality.

---



---

