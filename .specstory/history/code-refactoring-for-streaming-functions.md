## SpecStory

## Code Refactoring for Streaming Functions (1/28/2025, 2:22:38 PM)

_**User**_

ok create new files stream-messages.ts stream-conversations and stream-consent.ts and in each put their respective functions like for stream message put everything related to it starting from startMessageStreaming and in @streams.ts we will call startStreams and it will call startMessageStreaming, etc...

---

_**Assistant**_

I'll help you split this into separate files and organize the streaming functionality. Here's how we can restructure it:

1. First, let's create `stream-messages.ts`:

```typescript:features/streams/stream-messages.ts
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { addConversationMessageQuery } from "@/queries/use-conversation-messages-query";
import { updateConversationQueryData } from "@/queries/useConversationQuery";
import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { captureError } from "@/utils/capture-error";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { stopStreamingAllMessage, streamAllMessages } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import logger from "@utils/logger";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useStreamingStore } from "./streams";

export async function startMessageStreaming(account: string) {
  const store = useStreamingStore.getState();

  try {
    logger.info(`[Streaming] Starting messages stream for ${account}`);
    store.actions.updateStreamingState(account, { isStreamingMessages: true });

    await streamAllMessages({
      account,
      onNewMessage: (message) => onNewMessage({ account, message }),
    });
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream all messages for ${account}`,
    });
    store.actions.updateStreamingState(account, { isStreamingMessages: false });
    throw error;
  }
}

export { stopStreamingAllMessage };

async function onNewMessage(args: {
  account: string;
  message: DecodedMessageWithCodecsType;
}) {
  const { account, message } = args;

  if (message.contentTypeId.includes("group_updated")) {
    try {
      await handleNewGroupUpdatedMessage({
        account,
        topic: message.topic,
        message,
      });
    } catch (error) {
      captureError(error);
    }
  }

  const isMessageFromOtherUser = !messageIsFromCurrentAccountInboxId({
    message,
  });
  const isNonTextMessage = !isTextMessage(message);

  if (isMessageFromOtherUser || isNonTextMessage) {
    try {
      addConversationMessageQuery({
        account: client.address,
        topic: message.topic as ConversationTopic,
        message,
      });
    } catch (error) {
      captureError(error);
    }
  }

  try {
    updateConversationQueryData({
      account: client.address,
      topic: message.topic as ConversationTopic,
      conversationUpdate: {
        lastMessage: message,
      },
    });
  } catch (error) {
    captureError(error);
  }

  try {
    updateConversationInConversationsQueryData({
      account: client.address,
      topic: message.topic as ConversationTopic,
      conversationUpdate: {
        lastMessage: message,
      },
    });
  } catch (error) {
    captureError(error);
  }
}

const METADATA_FIELD_MAP = {
  group_name: "name",
  group_image_url_square: "imageUrlSquare",
  description: "description",
} as const;

type MetadataField = keyof typeof METADATA_FIELD_MAP;

function handleNewGroupUpdatedMessage(args: {
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) {
  const { account, topic, message } = args;

  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;

  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    refetchGroupMembersQuery(account, topic).catch(captureError);
    return;
  }

  if (content.metadataFieldsChanged.length > 0) {
    content.metadataFieldsChanged.forEach((field) => {
      const fieldName = field.fieldName as MetadataField;

      if (!(fieldName in METADATA_FIELD_MAP)) {
        captureError(new Error(`Unsupported metadata field name: ${fieldName}`));
        return;
      }

      const updateKey = METADATA_FIELD_MAP[fieldName];
      if (updateKey && field.newValue) {
        const update = { [updateKey]: field.newValue };

        updateConversationQueryData({
          account,
          topic,
          conversationUpdate: update,
        });

        updateConversationInConversationsQueryData({
          account,
          topic,
          conversationUpdate: update,
        });
      }
    });
    return;
  }

  invalidateGroupMembersQuery(account, topic);
}
```

2. Let's create `stream-conversations.ts`:

```typescript:features/streams/stream-conversations.ts
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import { addConversationToUnknownConsentConversationsQuery } from "@/queries/unknown-consent-conversations-query";
import { addConversationToConversationsQuery } from "@/queries/use-conversations-query";
import { stopStreamingConversations, streamConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import logger from "@utils/logger";
import { useStreamingStore } from "./streams";

export async function startConversationStreaming(account: string) {
  const store = useStreamingStore.getState();

  try {
    logger.info(`[Streaming] Starting conversation stream for ${account}`);
    store.actions.updateStreamingState(account, {
      isStreamingConversations: true,
    });

    await streamConversations({
      ethAddress: account,
      onNewConversation: (conversation) =>
        onNewConversation({ account, conversation }),
    });
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream conversations for ${account}`,
    });
    store.actions.updateStreamingState(account, {
      isStreamingConversations: false,
    });
    throw error;
  }
}

export { stopStreamingConversations };

function onNewConversation(args: { account: string; conversation: any }) {
  const { account, conversation } = args;

  if (isConversationAllowed(conversation)) {
    addConversationToConversationsQuery({
      account,
      conversation,
    });
  } else if (isConversationConsentUnknown(conversation)) {
    addConversationToUnknownConsentConversationsQuery({
      account,
      conversation,
    });
  }
}
```

3. Let's create `stream-consent.ts`:

```typescript:features/streams/stream-consent.ts
import { stopStreamingConsent, streamConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import logger from "@utils/logger";
import { useStreamingStore } from "./streams";

export async function startConsentStreaming(account: string) {
  const store = useStreamingStore.getState();

  try {
    logger.info(`[Streaming] Starting consent stream for ${account}`);
    store.actions.updateStreamingState(account, { isStreamingConsent: true });

    await streamConsent(account);
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream consent for ${account}`,
    });
    store.actions.updateStreamingState(account, { isStreamingConsent: false });
    throw error;
  }
}

export { stopStreamingConsent };
```

4. Finally, let's update the main `streams.ts` file to use these new modules:

```typescript:features/streams/streams.ts
// ... existing code for store definition ...

import { startMessageStreaming } from "./stream-messages";
import { startConversationStreaming } from "./stream-conversations";
import { startConsentStreaming } from "./stream-consent";
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";

export async function startStreaming(accountsToStream: string[]) {
  for (const account of accountsToStream) {
    const streamingState =
      useStreamingStore.getState().accountStreamingStates[account];

    if (!streamingState?.isStreamingConversations) {
      await startConversationStreaming(account).catch(captureError);
    }

    if (!streamingState?.isStreamingMessages) {
      await startMessageStreaming(account).catch(captureError);
    }

    if (!streamingState?.isStreamingConsent) {
      await startConsentStreaming(account).catch(captureError);
    }

    setupAccountTopicSubscription(account);
  }
}

export async function stopStreaming(accounts: string[]) {
  const store = useStreamingStore.getState();

  await Promise.all(
    accounts.map(async (account) => {
      try {
        await Promise.all([
          stopStreamingAllMessage({ ethAddress: account }),
          stopStreamingConversations({ ethAddress: account }),
          stopStreamingConsent(account),
        ]);
      } finally {
        store.actions.resetAccount(account);
      }
    })
  );
}

// ... rest of the existing code for app state listeners ...
```

This restructuring:
1. Separates concerns into dedicated files
2. Makes the code more maintainable and easier to test
3. Keeps related functionality together
4. Maintains the same behavior while improving organization

Each file now handles its specific streaming functionality while the main `streams.ts` file orchestrates the overall streaming process and maintains the store.

---



---

