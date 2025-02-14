## SpecStory

## Combine useMutation for Conversation and Message (2/4/2025, 11:58:25 AM)

_**User**_

can you put all the code for creating a conversation in useMutation to put it inside the useMutation for sendingMessage? Like the useMutation should be createConversationAndSendMessage you knopw? I think having 2 useMutation is overkill

---

_**Assistant**_

I'll help you combine the two mutations into a single `useMutation` hook. Here's how we can refactor it:

```typescript:features/search/use-optimistic-send-first-message.hook.ts
// ... existing code ...

export function useOptimisticSendFirstMessage() {
  const { mutateAsync: sendFirstMessage, isPending, isError } = useMutation({
    mutationFn: async (args: { inboxIds: InboxId[]; content: { text: string } }) => {
      const { inboxIds, content } = args;

      if (!inboxIds.length) {
        throw new Error("No inboxIds provided");
      }

      const currentAccount = getCurrentAccount()!;

      if (!currentAccount) {
        throw new Error("No current account");
      }

      // Create conversation
      let conversation: GroupWithCodecsType | DmWithCodecsType;
      if (inboxIds.length > 1) {
        conversation = await createXmtpGroup({
          account: currentAccount,
          inboxIds,
        });
      } else {
        conversation = await createXmtpDm({
          senderEthAddress: currentAccount,
          peerInboxId: inboxIds[0],
        });
      }

      // Send message
      const messageId = await sendMessage({
        topic: conversation.topic,
        content,
      });

      return { conversation, messageId };
    },
    onMutate: ({ inboxIds, content }) => {
      const currentAccountInboxId = getCurrentAccountInboxId()!;
      const currentAccount = getCurrentAccount()!;

      const isGroup = inboxIds.length > 1;
      const tempTopic = getConversationTempTopic({
        inboxIds: [currentAccountInboxId, ...inboxIds],
      });

      // Create optimistic conversation
      let tempConversation: GroupWithCodecsType | DmWithCodecsType;
      if (isGroup) {
        const groupParams: GroupParams = {
          id: "" as unknown as ConversationId,
          createdAt: 0,
          topic: tempTopic,
          name: "",
          isActive: true,
          addedByInboxId: currentAccountInboxId,
          imageUrlSquare: "",
          description: "",
          consentState: "allowed",
        };

        tempConversation = new Group(
          "" as unknown as InstallationId,
          groupParams,
          undefined
        );

        setGroupQueryData({
          account: currentAccount,
          topic: tempTopic,
          group: tempConversation as GroupWithCodecsType,
        });
      } else {
        const dmParams: DmParams = {
          id: "" as unknown as ConversationId,
          createdAt: 0,
          topic: tempTopic,
          consentState: "allowed",
        };

        tempConversation = new Dm(
          "" as unknown as InstallationId,
          dmParams,
          undefined
        );

        setDmQueryData({
          ethAccountAddress: currentAccount,
          inboxId: inboxIds[0],
          dm: tempConversation as Dm<SupportedCodecsType>,
        });
      }

      addConversationToAllowedConsentConversationsQuery({
        account: currentAccount,
        conversation: tempConversation,
      });

      // Create optimistic message
      const generatedMessageId = getRandomId();
      const optimisticMessage = DecodedMessage.fromObject({
        id: generatedMessageId as MessageId,
        topic: tempTopic as unknown as ConversationTopic,
        contentTypeId: contentTypesPrefixes.text,
        senderInboxId: currentAccountInboxId,
        sentNs: getTodayNs(),
        content: { text: content.text },
        fallback: content.text,
        deliveryStatus: "sending" as MessageDeliveryStatus,
      });

      addConversationMessageQuery({
        account: currentAccount,
        topic: tempTopic as unknown as ConversationTopic,
        message: optimisticMessage,
      });

      return { generatedMessageId, tempTopic };
    },
    onSuccess: (result, variables, context) => {
      if (!context) return;

      const currentAccount = getCurrentAccount()!;
      const currentAccountInboxId = getCurrentAccountInboxId()!;
      const { inboxIds } = variables;
      const isGroup = inboxIds.length > 1;
      const { conversation, messageId } = result;

      // Update conversation
      removeConversationFromAllowedConsentConversationsQuery({
        account: currentAccount,
        topic: context.tempTopic,
      });

      addConversationToAllowedConsentConversationsQuery({
        account: currentAccount,
        conversation,
      });

      replaceOptimisticConversationWithReal({
        account: currentAccount,
        tempTopic: context.tempTopic!,
        realTopic: conversation.topic,
      });

      if (!isGroup) {
        setDmQueryData({
          ethAccountAddress: currentAccount,
          inboxId: inboxIds[0],
          dm: conversation as Dm<SupportedCodecsType>,
        });
      }

      // Update message
      if (context.generatedMessageId) {
        replaceOptimisticMessageWithReal({
          tempId: context.generatedMessageId,
          topic: context.tempTopic as unknown as ConversationTopic,
          account: currentAccount,
          realMessage: {
            id: messageId,
            content: () => variables.content.text,
            contentTypeId: contentTypesPrefixes.text,
            sentNs: getTodayNs(),
            fallback: "new-message",
            deliveryStatus: "sent" as MessageDeliveryStatus,
            topic: context.tempTopic as unknown as ConversationTopic,
            senderInboxId: currentAccount,
            nativeContent: { text: variables.content.text },
          } as DecodedMessage,
        });
      }
    },
    onError: (error, variables, context) => {
      if (context?.tempTopic) {
        const currentAccount = getCurrentAccount()!;
        queryClient.removeQueries({
          queryKey: conversationMessagesQueryKey(
            currentAccount,
            context.tempTopic as ConversationTopic
          ),
        });
        queryClient.setQueryData(
          allowedConsentConversationsQueryKey(currentAccount),
          (previous: ConversationWithCodecsType[] = []) =>
            previous.filter((conv) => conv.topic !== context.tempTopic)
        );
      }
      sentryTrackError(error);
    },
  });

  const sendMessageCallback = useCallback(
    async (params: { inboxIds: InboxId[]; content: { text: string } }) => {
      try {
        await sendFirstMessage(params);
        return true;
      } catch (e) {
        captureErrorWithToast(e, {
          message:
            params.inboxIds.length > 1
              ? "Failed to create group"
              : "Failed to start conversation",
        });
        return false;
      }
    },
    [sendFirstMessage]
  );

  return {
    sendMessage: sendMessageCallback,
    isLoading: isPending,
    isError,
  };
}

// ... existing code ...
```

I've combined both mutations into a single `useMutation` hook that handles both creating the conversation and sending the message. The main changes are:

1. Combined the mutation functions into a single async function that creates the conversation and then sends the message
2. Merged the optimistic updates from both mutations into a single `onMutate` function
3. Combined the success handlers into a single `onSuccess` function that updates both the conversation and message data
4. Simplified the error handling to clean up both conversation and message data if something fails

The API remains the same, but internally it's now more efficient with a single mutation handling the entire flow. This should reduce complexity and potential race conditions between the two separate mutations.

---



---

