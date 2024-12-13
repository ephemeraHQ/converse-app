import { createV3ConversationListQueryObserver } from "@/queries/useV3ConversationListQuery";
import { subscribeToNotifications } from "./subscribeToNotifications";
import logger from "@/utils/logger";

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
  const observer = createV3ConversationListQueryObserver(account, "sync");
  let previous: number | undefined;
  const unsubscribe = observer.subscribe((conversationList) => {
    if (conversationList.data && conversationList.dataUpdatedAt !== previous) {
      previous = conversationList.dataUpdatedAt;
      subscribeToNotifications({
        conversations: conversationList.data,
        account,
      });
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
