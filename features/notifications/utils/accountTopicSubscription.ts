import {
  getAccountsList,
  getCurrentAccount,
  useAccountsStore,
} from "@/data/store/accountsStore";
import { useAppStore } from "@/data/store/appStore";
import { createAllowedConsentConversationsQueryObserver } from "@/queries/conversations-allowed-consent-query";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { resetNotifications } from "./resetNotifications";
import { subscribeToNotifications } from "./subscribeToNotifications";

export function setupTopicNotificationsSubscriptions() {
  useAppStore.subscribe((state, previousState) => {
    if (state.hydrationDone && !previousState.hydrationDone) {
      if (state.isInternetReachable && state.hydrationDone) {
        getAccountsList().forEach(setupAccountTopicSubscription);
      }
    }
  });

  useAccountsStore.subscribe((state, previousState) => {
    // Handle new accounts
    state.accounts.forEach((account) => {
      if (!previousState.accounts.includes(account)) {
        setupAccountTopicSubscription(account);
      }
    });

    // Handle removed accounts
    previousState.accounts.forEach((account) => {
      if (!state.accounts.includes(account)) {
        unsubscribeFromAccountTopicSubscription(account);
      }
    });
  });
}

const accountTopicUnsubscribeMap: Record<string, () => void> = {};

const setupAccountTopicSubscription = (account: string) => {
  // Already subscribed
  if (accountTopicUnsubscribeMap[account]) {
    logger.info(
      `[setupAccountTopicSubscription] already subscribed to account ${account}`
    );
    return;
  }

  logger.info(
    `[setupAccountTopicSubscription] subscribing to account ${account}`
  );

  // Create observer to watch for conversation changes
  const observer = createAllowedConsentConversationsQueryObserver({
    account,
    caller: `setupAccountTopicSubscription`,
  });

  let previousUpdateTime: number | undefined;

  // Subscribe to conversation updates
  const unsubscribe = observer.subscribe((conversationList) => {
    const { data, dataUpdatedAt } = conversationList;

    // Only process if we have data and it's been updated
    if (!data || dataUpdatedAt === previousUpdateTime) {
      return;
    }

    previousUpdateTime = dataUpdatedAt;

    // Set up notifications for conversations
    // subscribeToNotifications({
    //   conversations: data,
    //   account,
    // }).catch(captureError);

    // Reset notifications if this is the current account
    if (account === getCurrentAccount()) {
      resetNotifications(account);
    }
  });

  // Store unsubscribe function for cleanup
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
