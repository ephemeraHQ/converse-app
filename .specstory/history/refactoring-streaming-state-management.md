## SpecStory

## Refactoring Streaming State Management (1/28/2025, 2:27:31 PM)

_**User**_

updating if we are streaming like store.actions.updateStreamingState(account, { isStreamingMessages: true }); for example should be done in @streams.ts NOT in @@stream-messages.ts and @stream-conversations.ts  and @stream-consent.ts 

---

_**Assistant**_

I'll help you refactor this to move the streaming state management to the main `streams.ts` file. Here are the changes needed:

```typescript:features/streams/streams.ts
// ... existing code ...

async function startStreaming(accountsToStream: string[]) {
  const store = useStreamingStore.getState();

  for (const account of accountsToStream) {
    const streamingState = store.accountStreamingStates[account];

    try {
      if (!streamingState?.isStreamingConversations) {
        logger.info(`[Streaming] Starting conversation stream for ${account}`);
        store.actions.updateStreamingState(account, {
          isStreamingConversations: true,
        });
        await startConversationStreaming(account);
      }

      if (!streamingState?.isStreamingMessages) {
        logger.info(`[Streaming] Starting messages stream for ${account}`);
        store.actions.updateStreamingState(account, { 
          isStreamingMessages: true 
        });
        await startMessageStreaming(account);
      }

      if (!streamingState?.isStreamingConsent) {
        logger.info(`[Streaming] Starting consent stream for ${account}`);
        store.actions.updateStreamingState(account, { 
          isStreamingConsent: true 
        });
        await startConsentStreaming(account);
      }

      setupAccountTopicSubscription(account);
    } catch (error) {
      // Reset streaming state on error
      store.actions.updateStreamingState(account, {
        isStreamingConversations: false,
        isStreamingMessages: false,
        isStreamingConsent: false,
      });
      captureError(error);
    }
  }
}

// ... existing code ...
```

```typescript:features/streams/stream-messages.ts
export async function startMessageStreaming(account: string) {
  try {
    await streamAllMessages({
      account,
      onNewMessage: (message) => onNewMessage({ account, message }),
    });
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream all messages for ${account}`,
    });
    throw error;
  }
}

// ... rest of the file remains unchanged ...
```

```typescript:features/streams/stream-conversations.ts
export async function startConversationStreaming(account: string) {
  try {
    await streamConversations({
      ethAddress: account,
      onNewConversation: (conversation) =>
        onNewConversation({ account, conversation }),
    });
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream conversations for ${account}`,
    });
    throw error;
  }
}

// ... rest of the file remains unchanged ...
```

```typescript:features/streams/stream-consent.ts
export async function startConsentStreaming(account: string) {
  try {
    await streamConsent(account);
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream consent for ${account}`,
    });
    throw error;
  }
}

// ... rest of the file remains unchanged ...
```

The main changes are:
1. Removed streaming state management from individual stream files
2. Centralized all streaming state updates in the main `streams.ts` file
3. Added proper error handling that resets all streaming states if any stream fails to start
4. Simplified the individual streaming functions to focus only on their core functionality
5. Moved logging of stream start to the central location

This refactoring follows the principle of keeping state management centralized and makes the individual streaming modules more focused on their specific tasks.

---



---

