import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { streamLogger } from "@utils/logger"
import { useEffect } from "react"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { stopStreamingConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-stream"
import { stopStreamingAllMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages-stream"
import { stopStreamingConsent } from "@/features/xmtp/xmtp-preferences/xmtp-preferences-stream"
import { useAppStore } from "@/stores/app-store"
import { useAppState } from "@/stores/use-app-state-store"
import { captureError } from "@/utils/capture-error"
import { StreamError } from "@/utils/error"
import { startConversationStreaming } from "./stream-conversations"
import { startMessageStreaming } from "./stream-messages"
import { useStreamingStore } from "./stream-store"

export function useSetupStreamingSubscriptions() {
  // Start/stop streaming when internet connectivity changes
  // TODO: Fix this, we need to combine with the accounts store subscription below
  // useAppStore.subscribe(
  //   (state) => state.isInternetReachable,
  //   (isInternetReachable) => {
  //     streamLogger.debug(
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
    const unsubscribeAppStateStore = useAppState.subscribe(
      (state) => state.currentState,
      (currentState, previousState) => {
        const senders = useMultiInboxStore.getState().senders
        const inboxIds = senders.map((sender) => sender.inboxId)

        if (currentState === "active" && previousState !== "active") {
          streamLogger.debug("App became active, restarting streams")
          startStreaming(inboxIds).catch(captureError)
        } else if (currentState !== "active" && previousState === "active") {
          streamLogger.debug("App went to background, stopping streams")
          stopStreaming(inboxIds).catch(captureError)
        }
      },
    )

    // Handle account changes
    const unsubscribeMultiInboxStore = useMultiInboxStore.subscribe(
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
          startStreaming(newInboxIds).catch(captureError)
        }

        // Stop streaming for removed senders
        const removedInboxIds = previousInboxIds.filter(
          (inboxId) => !currentInboxIds.includes(inboxId),
        )

        if (removedInboxIds.length > 0) {
          stopStreaming(removedInboxIds).catch(captureError)
        }
      },
      {
        fireImmediately: true,
      },
    )

    return () => {
      unsubscribeAppStateStore()
      unsubscribeMultiInboxStore()
    }
  }, [])
}

async function startStreaming(inboxIdsToStream: IXmtpInboxId[]) {
  const store = useStreamingStore.getState()

  for (const inboxId of inboxIdsToStream) {
    const streamingState = store.accountStreamingStates[inboxId]

    if (!streamingState?.isStreamingConversations) {
      streamLogger.debug(`[Streaming] Starting conversation stream for ${inboxId}...`)
      try {
        await startConversationStreaming({ clientInboxId: inboxId })
        store.actions.updateStreamingState(inboxId, {
          isStreamingConversations: true,
        })
      } catch (error) {
        store.actions.updateStreamingState(inboxId, {
          isStreamingConversations: false,
        })
        captureError(
          new StreamError({ error, additionalMessage: "Error starting conversation stream" }),
        )
      }
    }

    if (!streamingState?.isStreamingMessages) {
      streamLogger.debug(`[Streaming] Starting messages stream for ${inboxId}...`)
      try {
        await startMessageStreaming({ clientInboxId: inboxId })
        store.actions.updateStreamingState(inboxId, {
          isStreamingMessages: true,
        })
      } catch (error) {
        store.actions.updateStreamingState(inboxId, {
          isStreamingMessages: false,
        })
        captureError(
          new StreamError({ error, additionalMessage: "Error starting messages stream" }),
        )
      }
    }

    // TODO: Fix and handle the consent stream. I think needed for notifications
    // if (!streamingState?.isStreamingConsent) {
    //   streamLogger.debug(`[Streaming] Starting consent stream for ${account}`);
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

async function stopStreaming(inboxIds: IXmtpInboxId[]) {
  const store = useStreamingStore.getState()

  await Promise.all(
    inboxIds.map(async (inboxId) => {
      try {
        streamLogger.debug(`[Streaming] Stopping streams for ${inboxId}`)
        await Promise.all([
          stopStreamingAllMessage({ inboxId }),
          stopStreamingConversations({ inboxId }),
          stopStreamingConsent({ inboxId }),
        ])
        streamLogger.debug(`[Streaming] Stopped streams for ${inboxId}`)
      } catch (error) {
        captureError(
          new StreamError({
            error,
            additionalMessage: `Failed to stop streams for ${inboxId}`,
          }),
        )
      } finally {
        store.actions.resetAccount(inboxId)
      }
    }),
  )
}
