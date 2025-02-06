import { getAccountsList, useAccountsStore } from "@/data/store/accountsStore";
import { useAppStore } from "@/data/store/appStore";
import { useAppState } from "@/data/store/use-app-state-store";
import { captureError } from "@/utils/capture-error";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import logger from "@utils/logger";
import { startConsentStreaming } from "./stream-consent";
import { startConversationStreaming } from "./stream-conversations";
import { startMessageStreaming } from "./stream-messages";
import { useStreamingStore } from "./stream-store";

export function setupStreamingSubscriptions() {
  // Start streaming when hydration is done
  useAppStore.subscribe(
    (state) => state.hydrationDone,
    (hydrationDone) => {
      if (hydrationDone) {
        logger.debug(`[Streaming] Hydration done changed: ${hydrationDone}`);
        const { isInternetReachable } = useAppStore.getState();
        if (isInternetReachable) {
          startStreaming(getAccountsList());
        }
      }
    }
  );

  // Start/stop streaming when internet connectivity changes
  useAppStore.subscribe(
    (state) => state.isInternetReachable,
    (isInternetReachable) => {
      logger.debug(
        `[Streaming] Internet reachability changed: ${isInternetReachable}`
      );
      const { hydrationDone } = useAppStore.getState();
      if (isInternetReachable && hydrationDone) {
        startStreaming(getAccountsList());
      }
    }
  );

  // Start/Stop streaming when accounts change
  useAccountsStore.subscribe((state, previousState) => {
    const { hydrationDone, isInternetReachable } = useAppStore.getState();

    if (!hydrationDone || !isInternetReachable) {
      return;
    }

    const previousAccounts = previousState?.accounts || [];
    const currentAccounts = state.accounts || [];

    // Handle new accounts
    const newAccounts = currentAccounts.filter(
      (account) => !previousAccounts.includes(account)
    );
    if (newAccounts.length > 0) {
      startStreaming(newAccounts);
    }

    // Handle removed accounts
    const removedAccounts = previousAccounts.filter(
      (account) => !currentAccounts.includes(account)
    );
    if (removedAccounts.length > 0) {
      stopStreaming(removedAccounts);
    }
  });

  // Start/Stop streaming when app state changes
  useAppState.subscribe((state) => {
    const isGoingActive =
      state.currentState === "active" && state.previousState !== "active";
    const isLeavingActive =
      state.previousState === "active" && state.currentState !== "active";

    if (isGoingActive) {
      logger.debug("[Streaming] App is now active, reconnecting streams");
      const { hydrationDone, isInternetReachable } = useAppStore.getState();
      if (hydrationDone && isInternetReachable) {
        startStreaming(getAccountsList());
      }
    } else if (isLeavingActive) {
      logger.debug("[Streaming] App is now inactive, stopping xmtp streams");
      stopStreaming(getAccountsList());
    }
  });
}

async function startStreaming(accountsToStream: string[]) {
  logger.debug(
    "[Streaming] TEMP DISABLING Starting streaming for accounts:",
    accountsToStream
  );
  return;
  const store = useStreamingStore.getState();

  for (const account of accountsToStream) {
    const streamingState = store.accountStreamingStates[account];

    if (!streamingState?.isStreamingConversations) {
      logger.info(`[Streaming] Starting conversation stream for ${account}`);
      try {
        store.actions.updateStreamingState(account, {
          isStreamingConversations: true,
        });
        await startConversationStreaming(account);
      } catch (error) {
        store.actions.updateStreamingState(account, {
          isStreamingConversations: false,
        });
        captureError(error);
      }
    }

    if (!streamingState?.isStreamingMessages) {
      logger.info(`[Streaming] Starting messages stream for ${account}`);
      try {
        store.actions.updateStreamingState(account, {
          isStreamingMessages: true,
        });
        await startMessageStreaming({ account });
      } catch (error) {
        store.actions.updateStreamingState(account, {
          isStreamingMessages: false,
        });
        captureError(error);
      }
    }

    if (!streamingState?.isStreamingConsent) {
      logger.info(`[Streaming] Starting consent stream for ${account}`);
      try {
        store.actions.updateStreamingState(account, {
          isStreamingConsent: true,
        });
        await startConsentStreaming(account);
      } catch (error) {
        store.actions.updateStreamingState(account, {
          isStreamingConsent: false,
        });
        captureError(error);
      }
    }
  }
}

async function stopStreaming(accounts: string[]) {
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
