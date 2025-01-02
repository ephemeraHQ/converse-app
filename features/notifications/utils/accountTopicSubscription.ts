import { createConversationListQueryObserver } from "@/queries/useConversationListQuery";
import { subscribeToNotifications } from "./subscribeToNotifications";
import logger from "@/utils/logger";
import { resetNotifications } from "./resetNotifications";

const accountTopicUnsubscribeMap: Record<string, () => void> = {};

export const setupAccountTopicSubscription = (account: string) => {
  if (accountTopicUnsubscribeMap[account]) {
    logger.info(
      `[setupAccountTopicSubscription] already subscribed to account ${account}`
    );
    return accountTopicUnsubscribeMap[account];
  }
  logger.info(
    `[setupAccountTopicSubscription] subscribing to account ${account}`
  );
  const observer = createConversationListQueryObserver({
    account,
    context: "sync",
  });
  let previous: number | undefined;
  const unsubscribe = observer.subscribe((conversationList) => {
    if (conversationList.data && conversationList.dataUpdatedAt !== previous) {
      previous = conversationList.dataUpdatedAt;
      subscribeToNotifications({
        conversations: conversationList.data,
        account,
      });
      // For now just reset notifications when we get a new conversation list
      /*
        TODO: We can probably do better here
        - Counter by account (Only clear the counter for the account we are subscribing to so users know they have new messages on other accounts)
      */
      resetNotifications();
    }
  });
  accountTopicUnsubscribeMap[account] = unsubscribe;
  return unsubscribe;
};

export const unsubscribeFromAccountTopicSubscription = (account: string) => {
  const unsubscribe = accountTopicUnsubscribeMap[account];
  if (unsubscribe) {
    unsubscribe();
    delete accountTopicUnsubscribeMap[account];
  }
};
