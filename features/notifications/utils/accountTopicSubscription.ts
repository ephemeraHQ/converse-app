import { currentAccount } from "@/data/store/accountsStore";
import { createConversationsQueryObserver } from "@/queries/use-conversations-query";
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
  const observer = createConversationsQueryObserver({
    account,
  });
  let previous: number | undefined;
  const unsubscribe = observer.subscribe((conversationList) => {
    if (conversationList.data && conversationList.dataUpdatedAt !== previous) {
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
