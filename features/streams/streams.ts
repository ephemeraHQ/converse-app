import { useAppStore } from "@/data/store/appStore";
import {
  MultiInboxClientRestorationStates,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { captureError } from "@/utils/capture-error";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import { logger } from "@utils/logger";
import { startConversationStreaming } from "./stream-conversations";
import { startMessageStreaming } from "./stream-messages";
import { useStreamingStore } from "./stream-store";
import { useEffect, useRef } from "react";

// todo move this to multi-inbox-client
// when clients are added and removed; start and stop respective streams
export function useSetupStreamingSubscriptions() {
  // Start/stop streaming when internet connectivity changes
  // TODO: Fix this, we need to combine with the accounts store subscription below
  // useAppStore.subscribe(
  //   (state) => state.isInternetReachable,
  //   (isInternetReachable) => {
  //     logger.debug(
  //       `[Streaming] Internet reachability changed: ${isInternetReachable}`
  //     );
  //     if (!isInternetReachable) {
  //       return;
  //     }

  //     startStreaming(getAccountsList());
  //   }
  // );

  const firstRenderRef = useRef(true);

  useEffect(() => {
    const unsubscribe = useAccountsStore.subscribe(
      (state) =>
        [state.senders, state.multiInboxClientRestorationState] as const,
      (
        [senders, multiInboxClientRestorationState],
        [previousSenders, previousMultiInboxClientRestorationState]
      ) => {
        const { isInternetReachable } = useAppStore.getState();

        if (!isInternetReachable) {
          return;
        }

        if (
          multiInboxClientRestorationState !==
          MultiInboxClientRestorationStates.restored
        ) {
          return;
        }

        const previousAccounts = previousSenders.map(
          (sender: { ethereumAddress: string }) => sender.ethereumAddress
        );

        const currentAccounts = senders.map(
          (sender: { ethereumAddress: string }) => sender.ethereumAddress
        );

        // Handle new accounts
        const newAccounts = currentAccounts.filter(
          (account: string) =>
            !previousAccounts.includes(account) || !firstRenderRef.current
        );

        if (newAccounts.length > 0) {
          startStreaming(newAccounts);
        }

        // Handle removed accounts
        const removedAccounts = previousAccounts.filter(
          (account: string) => !currentAccounts.includes(account)
        );

        if (removedAccounts.length > 0) {
          stopStreaming(removedAccounts);
        }

        firstRenderRef.current = false;
      },
      {
        fireImmediately: true,
      }
    );

    return () => unsubscribe();
  }, []);
}

async function startStreaming(accountsToStream: string[]) {
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

    // TODO: Fix and handle the consent stream. I think needed for notifications
    // if (!streamingState?.isStreamingConsent) {
    //   logger.info(`[Streaming] Starting consent stream for ${account}`);
    //   try {
    //     store.actions.updateStreamingState(account, {
    //       isStreamingConsent: true,
    //     });
    //     await startConsentStreaming(account);
    //   } catch (error) {
    //     store.actions.updateStreamingState(account, {
    //       isStreamingConsent: false,
    //     });
    //     captureError(error);
    //   }
    // }
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
