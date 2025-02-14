## SpecStory

## Improving Conversation Subscription Management (2/13/2025, 3:40:40 PM)

_**User**_

need to also call unsubscribeFromConversation if the conversation is removed from the list. So now it just goes through all the allowed conversations and subscribe but we need to make it better

---

_**Assistant**_

I'll help modify the code to handle unsubscribing from conversations that are no longer in the allowed list. We'll need to track the previous conversations and compare them with the new list.

Here's the improved implementation:

```typescript:features/notifications/notifications-conversations-subscriptions.ts
import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";
import { queryClient } from "@/queries/queryClient";
import { captureError } from "@/utils/capture-error";
import { QueryObserver } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { logger } from "@/utils/logger";

function subscribeToConversationsNotifications(args: {
  conversationTopics: ConversationTopic[];
}) {
  // TODO: Implement the actual subscription logic
  return Promise.resolve();
}

function unsubscribeFromConversationsNotifications(args: {
  conversationTopics: ConversationTopic[];
}) {
  // TODO: Implement the actual unsubscription logic
  return Promise.resolve();
}

export function setupConversationNotificationsObserver(args: {
  account: string;
}) {
  const { account } = args;
  let previousTopics: ConversationTopic[] = [];

  const observer = new QueryObserver(
    queryClient,
    getAllowedConsentConversationsQueryOptions({ account })
  );

  // Set up query observer
  const unsubscribe = observer.subscribe((query) => {
    if (!query.data) {
      return;
    }

    const currentTopics = query.data.map((conv) => conv.topic);

    // Find topics to unsubscribe from (present in previous but not in current)
    const topicsToUnsubscribe = previousTopics.filter(
      (topic) => !currentTopics.includes(topic)
    );

    // Find topics to subscribe to (present in current but not in previous)
    const topicsToSubscribe = currentTopics.filter(
      (topic) => !previousTopics.includes(topic)
    );

    // Handle unsubscriptions
    if (topicsToUnsubscribe.length > 0) {
      logger.debug(
        `[setupConversationNotificationsObserver] Unsubscribing from ${topicsToUnsubscribe.length} conversations`
      );
      unsubscribeFromConversationsNotifications({
        conversationTopics: topicsToUnsubscribe,
      }).catch(captureError);
    }

    // Handle new subscriptions
    if (topicsToSubscribe.length > 0) {
      logger.debug(
        `[setupConversationNotificationsObserver] Subscribing to ${topicsToSubscribe.length} conversations`
      );
      subscribeToConversationsNotifications({
        conversationTopics: topicsToSubscribe,
      }).catch(captureError);
    }

    // Update previous topics for next comparison
    previousTopics = currentTopics;
  });

  // Return cleanup function
  return () => {
    // Unsubscribe from all conversations when cleaning up
    if (previousTopics.length > 0) {
      unsubscribeFromConversationsNotifications({
        conversationTopics: previousTopics,
      }).catch(captureError);
    }
    unsubscribe();
  };
}
```

Key changes made:

1. Added a `previousTopics` variable to keep track of the currently subscribed conversations.
2. When new data arrives, we:
   - Compare previous and current topics to determine which ones need subscription/unsubscription
   - Unsubscribe from removed conversations
   - Subscribe to new conversations
   - Update the previousTopics for the next comparison
3. Added cleanup logic to unsubscribe from all conversations when the observer is destroyed
4. Added logging to track subscription/unsubscription operations

This implementation ensures that we properly manage subscriptions as conversations are added or removed from the allowed list.

---



---

