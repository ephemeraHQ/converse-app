import { logger, streamLogger } from "@utils/logger"
import { useEffect } from "react"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { stopStreamingConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-stream"
import { stopStreamingAllMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages-stream"
import { stopStreamingConsent } from "@/features/xmtp/xmtp-preferences/xmtp-preferences-stream"
import { useAppStore } from "@/stores/app-store"
import { useAppState } from "@/stores/use-app-state-store"
import { captureError } from "@/utils/capture-error"
import { startConversationStreaming } from "./stream-conversations"
import { startMessageStreaming } from "./stream-messages"
import { useStreamingStore } from "./stream-store"

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

  // Start streaming for all senders on first render
  useEffect(() => {
    const senders = useMultiInboxStore.getState().senders
    startStreaming(senders.map((sender) => sender.ethereumAddress))
  }, [])

  useEffect(() => {
    // Handle app state changes
    const unsubscribeAppState = useAppState.subscribe(
      (state) => state.currentState,
      (currentState, previousState) => {
        const senders = useMultiInboxStore.getState().senders
        const ethAddresses = senders.map((sender) => sender.ethereumAddress)

        if (currentState === "active" && previousState !== "active") {
          streamLogger.debug("App became active, restarting streams")
          // Stop existing streams first to ensure clean state
          stopStreaming(ethAddresses).then(() => {
            startStreaming(ethAddresses)
          })
        } else if (currentState !== "active" && previousState === "active") {
          streamLogger.debug("App went to background, stopping streams")
          stopStreaming(ethAddresses)
        }
      },
    )

    // Handle account changes
    const unsubscribeAccounts = useMultiInboxStore.subscribe(
      (state) => [state.senders] as const,
      ([senders], [previousSenders]) => {
        const { isInternetReachable } = useAppStore.getState()
        const { currentState } = useAppState.getState()

        // Only manage streams if app is active and has internet
        if (!isInternetReachable || currentState !== "active") {
          return
        }

        const previousAddresses = previousSenders.map((sender) => sender.ethereumAddress)

        const currentAddresses = senders.map((sender) => sender.ethereumAddress)

        // Start streaming for new senders
        const newAddresses = currentAddresses.filter(
          (address) => !previousAddresses.includes(address),
        )

        if (newAddresses.length > 0) {
          startStreaming(newAddresses)
        }

        // Stop streaming for removed senders
        const removedAddresses = previousAddresses.filter(
          (address) => !currentAddresses.includes(address),
        )

        if (removedAddresses.length > 0) {
          stopStreaming(removedAddresses)
        }
      },
      {
        fireImmediately: true,
      },
    )

    return () => {
      unsubscribeAppState()
      unsubscribeAccounts()
    }
  }, [])
}

async function startStreaming(accountsToStream: string[]) {
  const store = useStreamingStore.getState()

  for (const account of accountsToStream) {
    const streamingState = store.accountStreamingStates[account]

    if (!streamingState?.isStreamingConversations) {
      logger.debug(`[Streaming] Starting conversation stream for ${account}`)
      try {
        await startConversationStreaming(account)
        store.actions.updateStreamingState(account, {
          isStreamingConversations: true,
        })
      } catch (error) {
        store.actions.updateStreamingState(account, {
          isStreamingConversations: false,
        })
        captureError(error)
      }
    }

    if (!streamingState?.isStreamingMessages) {
      logger.debug(`[Streaming] Starting messages stream for ${account}`)
      try {
        await startMessageStreaming({ account })
        store.actions.updateStreamingState(account, {
          isStreamingMessages: true,
        })
      } catch (error) {
        store.actions.updateStreamingState(account, {
          isStreamingMessages: false,
        })
        captureError(error)
      }
    }

    // TODO: Fix and handle the consent stream. I think needed for notifications
    // if (!streamingState?.isStreamingConsent) {
    //   logger.debug(`[Streaming] Starting consent stream for ${account}`);
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
  const store = useStreamingStore.getState()

  await Promise.all(
    accounts.map(async (account) => {
      try {
        await Promise.all([
          stopStreamingAllMessage({ ethAddress: account }),
          stopStreamingConversations({ ethAddress: account }),
          stopStreamingConsent(account),
        ])
      } finally {
        store.actions.resetAccount(account)
      }
    }),
  )
}
