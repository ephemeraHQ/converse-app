import {
  getAccountsList,
  useAccountsStore,
  AuthStatuses,
} from "@/features/multi-inbox/multi-inbox.store";
import { useAppStore } from "@/data/store/appStore";
import { captureError } from "@/utils/capture-error";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import { logger } from "@utils/logger";
import { startConsentStreaming } from "./stream-consent";
import { startConversationStreaming } from "./stream-conversations";
import { startMessageStreaming } from "./stream-messages";
import { useStreamingStore } from "./stream-store";

export function setupStreamingSubscriptions() {
  // Start streaming when hydration is done
  useAppStore.subscribe(
    (state) => state.hydrationDone,
    (hydrationDone) => {
      const isInternetReachable = useAppStore.getState().isInternetReachable;
      logger.debug(
        `[Streaming] Hydration done changed: ${hydrationDone}, isInternetReachable: ${isInternetReachable}`
      );
      if (!isInternetReachable || !hydrationDone) {
        return;
      }

      startStreaming(getAccountsList());
    }
  );

  // Start/stop streaming when internet connectivity changes
  useAppStore.subscribe(
    (state) => state.isInternetReachable,
    (isInternetReachable) => {
      const { hydrationDone } = useAppStore.getState();
      logger.debug(
        `[Streaming] Internet reachability changed: ${isInternetReachable}, hydrationDone: ${hydrationDone}`
      );
      if (!isInternetReachable || !hydrationDone) {
        return;
      }

      startStreaming(getAccountsList());
    }
  );

  // Start/Stop streaming when accounts change
  // todo(lustig) I believe this should be handled immediately when
  // an account is added (removing has not been implemented yet)
  // I'm not going to play with this right now though, but we should
  // come back to it and simplify it if possible.
  useAccountsStore.subscribe((state, previousState) => {
    const { hydrationDone, isInternetReachable } = useAppStore.getState();

    if (!hydrationDone || !isInternetReachable) {
      return;
    }

    const previousAccounts =
      previousState?.senders?.map((sender) => sender.ethereumAddress) || [];
    const currentAccounts =
      state.senders?.map((sender) => sender.ethereumAddress) || [];

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
}

async function startStreaming(accountsToStream: string[]) {
  const store = useStreamingStore.getState();
  const isSignedIn =
    useAccountsStore.getState().authStatus === AuthStatuses.signedIn;
  if (!isSignedIn) {
    logger.info("[Streaming] Not signed in, skipping startStreaming");
    return;
  }

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
