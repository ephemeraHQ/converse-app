import { logger, streamLogger } from "@utils/logger"
import { InboxId } from "@xmtp/react-native-sdk"
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
    startStreaming(senders.map((sender) => sender.inboxId))
  }, [])

  useEffect(() => {
    // Handle app state changes
    const unsubscribeAppState = useAppState.subscribe(
      (state) => state.currentState,
      (currentState, previousState) => {
        const senders = useMultiInboxStore.getState().senders
        const inboxIds = senders.map((sender) => sender.inboxId)

        if (currentState === "active" && previousState !== "active") {
          streamLogger.debug("App became active, restarting streams")
          // Stop existing streams first to ensure clean state
          stopStreaming(inboxIds).then(() => {
            startStreaming(inboxIds)
          })
        } else if (currentState !== "active" && previousState === "active") {
          streamLogger.debug("App went to background, stopping streams")
          stopStreaming(inboxIds)
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

        const previousInboxIds = previousSenders.map((sender) => sender.inboxId)

        const currentInboxIds = senders.map((sender) => sender.inboxId)

        // Start streaming for new senders
        const newInboxIds = currentInboxIds.filter((inboxId) => !previousInboxIds.includes(inboxId))

        if (newInboxIds.length > 0) {
          startStreaming(newInboxIds)
        }

        // Stop streaming for removed senders
        const removedInboxIds = previousInboxIds.filter(
          (inboxId) => !currentInboxIds.includes(inboxId),
        )

        if (removedInboxIds.length > 0) {
          stopStreaming(removedInboxIds)
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

async function startStreaming(inboxIdsToStream: string[]) {
  const store = useStreamingStore.getState()

  for (const inboxId of inboxIdsToStream) {
    const streamingState = store.accountStreamingStates[inboxId]

    if (!streamingState?.isStreamingConversations) {
      logger.debug(`[Streaming] Starting conversation stream for ${inboxId}`)
      try {
        await startConversationStreaming({ clientInboxId: inboxId })
        store.actions.updateStreamingState(inboxId, {
          isStreamingConversations: true,
        })
      } catch (error) {
        store.actions.updateStreamingState(inboxId, {
          isStreamingConversations: false,
        })
        captureError(error)
      }
    }

    if (!streamingState?.isStreamingMessages) {
      logger.debug(`[Streaming] Starting messages stream for ${inboxId}`)
      try {
        await startMessageStreaming({ clientInboxId: inboxId })
        store.actions.updateStreamingState(inboxId, {
          isStreamingMessages: true,
        })
      } catch (error) {
        store.actions.updateStreamingState(inboxId, {
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

async function stopStreaming(inboxIds: InboxId[]) {
  const store = useStreamingStore.getState()

  await Promise.all(
    inboxIds.map(async (account) => {
      try {
        await Promise.all([
          stopStreamingAllMessage({ inboxId: account }),
          stopStreamingConversations({ inboxId: account }),
          stopStreamingConsent(account),
        ])
      } finally {
        store.actions.resetAccount(account)
      }
    }),
  )
}
