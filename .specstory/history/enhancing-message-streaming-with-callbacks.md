## SpecStory

## Enhancing Message Streaming with Callbacks (1/28/2025, 2:01:02 PM)

_**User**_

make this better by using args: {} and using like @xmtp-conversations-stream.ts a onNewMessage

---

_**Assistant**_

I'll help modify the code to use object parameters and add an `onNewMessage` callback pattern. Here are the key changes needed:

```typescript:utils/xmtpRN/xmtp-messages/xmtp-messages-stream.ts
// ... existing code ...

type StreamAllMessagesArgs = {
  account: string;
  onNewMessage?: (message: DecodedMessageWithCodecsType) => Promise<void>;
};

export const streamAllMessages = async ({ account, onNewMessage }: StreamAllMessagesArgs) => {
  await stopStreamingAllMessage({ account });

  const client = await getXmtpClient(account);

  logger.info(`[XmtpRN] Streaming messages for ${client.address}`);

  await client.conversations.streamAllMessages(async (message) => {
    logger.info(`[XmtpRN] Received a message for ${client.address}`, {
      id: message.id,
      text: isProd ? "Redacted" : message.nativeContent.text,
      topic: message.topic,
    });

    // Call the optional callback if provided
    if (onNewMessage) {
      await onNewMessage(message);
    }

    if (message.contentTypeId.includes("group_updated")) {
      try {
        await handleNewGroupUpdatedMessage({
          account: client.address,
          topic: message.topic,
          message,
        });
      } catch (error) {
        captureError(error);
      }
    }

    // ... rest of the existing message handling code ...
  });
};

type StopStreamingAllMessageArgs = {
  account: string;
};

export const stopStreamingAllMessage = async ({ account }: StopStreamingAllMessageArgs) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  logger.debug(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  await client.conversations.cancelStreamAllMessages();
};

// ... rest of the existing code ...
```

```typescript:components/XmtpEngine.tsx
// ... existing code ...

actions: {
  // ... other actions ...

  startStreaming: (accountsToStream) => {
    accountsToStream.forEach((account) => {
      const store = useStreamingStore.getState();
      const streamingState = store.accountStreamingStates[account];

      if (!streamingState?.isStreamingConversations) {
        logger.info(`[Streaming] Starting conversation stream for ${account}`);
        store.actions.setStreamingState(account, {
          isStreamingConversations: true,
        });

        streamConversations({ 
          ethAddress: account,
          onNewConversation: (conversation) => {
            // Handle new conversation if needed
          }
        }).catch((e) => {
          logger.error(e, {
            context: `Failed to stream conversations for ${account}`,
          });
          store.actions.setStreamingState(account, {
            isStreamingConversations: false,
          });
        });
      }

      if (!streamingState?.isStreamingMessages) {
        logger.info(`[Streaming] Starting messages stream for ${account}`);
        store.actions.setStreamingState(account, {
          isStreamingMessages: true,
        });

        streamAllMessages({ 
          account,
          onNewMessage: async (message) => {
            // Handle new message if needed
          }
        }).catch((e) => {
          logger.error(e, {
            context: `Failed to stream all messages for ${account}`,
          });
          store.actions.setStreamingState(account, {
            isStreamingMessages: false,
          });
        });
      }

      // ... rest of the streaming setup ...
    });
  },

  stopStreaming: async (accounts) => {
    const store = useStreamingStore.getState();

    await Promise.all(
      accounts.map(async (account) => {
        await Promise.all([
          stopStreamingAllMessage({ account }),
          stopStreamingConversations({ ethAddress: account }),
          stopStreamingConsent(account),
        ]);
        store.actions.resetStreamingState(account);
      })
    );
  },

  // ... rest of the actions ...
}

// ... rest of the code ...
```

Key improvements made:
1. Added object parameters for all function calls
2. Added an optional `onNewMessage` callback pattern similar to `xmtp-conversations-stream.ts`
3. Updated all calling code to use the new parameter style
4. Maintained consistent error handling and logging patterns
5. Kept the existing functionality while making the code more maintainable and consistent with the style guide

The changes make the code more consistent with the style guide's preference for object parameters and make it easier to add new parameters in the future without breaking existing code.

---



---

