import { currentAccount } from "@/data/store/accountsStore";
import { createConversationsQueryObserver } from "@/queries/conversations-query";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { resetNotifications } from "./resetNotifications";
import { subscribeToNotifications } from "./subscribeToNotifications";

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
  const observer = createConversationsQueryObserver({
    account,
  });
  let previous: number | undefined;
  const unsubscribe = observer.subscribe((conversationList) => {
    if (conversationList.data && conversationList.dataUpdatedAt !== previous) {
      previous = conversationList.dataUpdatedAt;
      subscribeToNotifications({
        conversations: conversationList.data,
        account,
      }).catch(captureError);
      if (account === currentAccount()) {
        resetNotifications(account);
      }
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
