import { subscribeToNotifications } from "./subscribeToNotifications";
import logger from "@/utils/logger";
import { resetNotifications } from "./resetNotifications";
import { createConversationListQueryObserver } from "@/queries/useConversationListQuery";
import { InboxId } from "@xmtp/react-native-sdk";

const accountTopicUnsubscribeMap: Record<InboxId, () => void> = {};

export const setupAccountTopicSubscription = (inboxId: InboxId) => {
  if (accountTopicUnsubscribeMap[inboxId]) {
    logger.info(
      `[setupAccountTopicSubscription] already subscribed to account ${inboxId}`
    );
    return accountTopicUnsubscribeMap[inboxId];
  }
  logger.info(
    `[setupAccountTopicSubscription] subscribing to account ${inboxId}`
  );
  const observer = createConversationListQueryObserver({
    inboxId,
    context: "sync",
  });
  let previous: number | undefined;
  const unsubscribe = observer.subscribe((conversationList) => {
    if (conversationList.data && conversationList.dataUpdatedAt !== previous) {
      previous = conversationList.dataUpdatedAt;
      subscribeToNotifications({
        conversations: conversationList.data,
        inboxId,
      });
      // For now just reset notifications when we get a new conversation list
      /*
        TODO: We can probably do better here
        - Counter by account (Only clear the counter for the account we are subscribing to so users know they have new messages on other accounts)
      */
      resetNotifications();
    }
  });
  accountTopicUnsubscribeMap[inboxId] = unsubscribe;
  return unsubscribe;
};

export const unsubscribeFromAccountTopicSubscription = (account: string) => {
  const unsubscribe = accountTopicUnsubscribeMap[account];
  if (unsubscribe) {
    unsubscribe();
    delete accountTopicUnsubscribeMap[account];
  }
};
