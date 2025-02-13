import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";
import { queryClient } from "@/queries/queryClient";
import { captureError } from "@/utils/capture-error";
import { logger } from "@/utils/logger";
import { QueryObserver } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

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
    unsubscribe();
  };
}
