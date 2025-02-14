## SpecStory

## Removing Logger Code from TypeScript (2/4/2025, 10:59:33 AM)

_**User**_

remove all the logger stuff

---

_**Assistant**_

I'll help remove all the logger-related code. Here's the simplified version showing the key changes:

```typescript:features/search/use-optimistic-send-first-message.hook.ts
// ... existing code ...

export function useOptimisticSendFirstMessage({
  members,
}: IUseOptimisticSendFirstMessageParams) {
  members = members.map((member) => member.toLowerCase());
  const currentAccount = getCurrentAccount()!;
  const isGroup = members.length > 1;

  const _tempTopic = generateGroupHashFromMemberIds(members);
  const tempTopic = _tempTopic
    ? prefixStringWithV3TopicPrefix(_tempTopic)
    : undefined;

  const {
    mutateAsync: createConversationAsync,
    isPending,
    isError,
  } = useMutation<
    Group<SupportedCodecsType> | Dm<SupportedCodecsType>,
    Error,
    void,
    unknown
  >({
    mutationFn: async () => {
      if (!members.length) {
        throw new Error("No members provided");
      }
      if (!tempTopic) {
        throw new Error("Failed to generate temp topic");
      }

      let conversation;
      if (isGroup) {
        conversation = await createGroupWithDefaultsByAccount({
          account: currentAccount,
          peerEthereumAddresses: members,
        });
      } else {
        conversation = await createConversationByAccount(
          currentAccount,
          members[0]
        );
      }

      return conversation;
    },
    onMutate: () => {
      const groupParams: GroupParams = {
        id: "" as unknown as ConversationId,
        createdAt: 0,
        topic: tempTopic as unknown as ConversationTopic,
        name: "Group",
        isActive: true,
        addedByInboxId: currentAccount,
        imageUrlSquare: "imageurl",
        description: "description",
        consentState: "allowed",
      };

      const group = new Group(
        "" as unknown as InstallationId,
        groupParams,
        undefined
      );

      const dmParams: DmParams = {
        id: "" as unknown as ConversationId,
        createdAt: 0,
        topic: tempTopic as unknown as ConversationTopic,
        consentState: "allowed",
      };

      const dm = new Dm("" as unknown as InstallationId, dmParams, undefined);

      const tempConversation = isGroup ? group : dm;

      addConversationToAllowedConsentConversationsQuery({
        account: currentAccount,
        conversation: tempConversation,
      });
      setConversationQueryData({
        account: currentAccount,
        topic: tempConversation.topic,
        conversation: tempConversation,
      });
    },
    onSuccess: (newConversation) => {
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
          peer: members[0],
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
      if (!tempTopic) {
        throw new Error("Temp topic required for group messages");
      }

      const generatedMessageId = getRandomId();

      const optimisticMessage = DecodedMessage.fromObject({
        id: generatedMessageId as MessageId,
        topic: tempTopic as unknown as ConversationTopic,
        contentTypeId: contentTypesPrefixes.text,
        senderInboxId: currentAccount,
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
    onSuccess: (messageId, variables, context) => {
      if (context?.generatedMessageId) {
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
    async (params: IOptimisticSendFirstMessageParams): Promise<boolean> => {
      try {
        await sendMessageAsync({
          content: params.content,
          conversationTopic: tempTopic!,
        });
        return true;
      } catch (error) {
        showSnackbar({
          message: isGroup
            ? "Failed to create group"
            : "Failed to start conversation",
        });
        return false;
      }
    },
    [sendMessageAsync, isGroup, tempTopic]
  );

  return {
    sendMessage: sendMessageCallback,
    tempTopic,
    isLoading: isPending,
    isError,
  };
}

// ... existing code ...
```

I've removed all `logger` calls while preserving the core functionality. The main changes include:
1. Removed all `logger.info`, `logger.error`, and `logger.debug` statements
2. Kept the error handling logic but removed the logging parts
3. Maintained the flow of the code and all business logic
4. Preserved error tracking with Sentry where it was used

The functionality remains exactly the same, just without the logging instrumentation.

---



---

