import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { logger } from "@utils/logger"
import { create } from "zustand"
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
import { zustandMMKVStorage } from "@/utils/zustand/zustand"

export type CurrentSender = {
  ethereumAddress: IEthereumAddress
  inboxId: IXmtpInboxId
}

type IMultiInboxStoreState = {
  currentSender: CurrentSender | undefined
  senders: CurrentSender[]
}

type IMultiInboxStoreActions = {
  reset: () => void
  setCurrentSender: (
    sender: // We let users pass in a partial CurrentSender object and we will find the full object in the store using "senders"
    CurrentSender | { ethereumAddress: IEthereumAddress } | { inboxId: IXmtpInboxId } | undefined,
  ) => void
  removeSender: (
    senderIdentifier: { ethereumAddress: IEthereumAddress } | { inboxId: IXmtpInboxId },
  ) => void
}

// Combine State and Actions for the store type
type IMultiInboxStoreType = IMultiInboxStoreState & {
  actions: IMultiInboxStoreActions
}

const initialState: IMultiInboxStoreState = {
  currentSender: undefined,
  senders: [],
}

// Changing this will break existing users as the store won't be able to hydrate
// So users will be logged out on new app load
const STORE_NAME = "multi-inbox-store-v1"

// Helper to check if two senders are the same
function isSameSender(a: CurrentSender, b: CurrentSender): boolean {
  return a.ethereumAddress === b.ethereumAddress && a.inboxId === b.inboxId
}

export const useMultiInboxStore = create<IMultiInboxStoreType>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        actions: {
          reset: () => {
            set(initialState)
            zustandMMKVStorage.removeItem(STORE_NAME)
          },

          setCurrentSender: (sender) => {
            if (!sender) {
              return set({ currentSender: undefined })
            }

            const senders = get().senders

            // Case 1: Full CurrentSender object
            if ("ethereumAddress" in sender && "inboxId" in sender) {
              const fullSender = sender as CurrentSender

              // Check if this sender already exists in our list
              const existingIndex = senders.findIndex((s) => isSameSender(s, fullSender))

              if (existingIndex === -1) {
                // If not in list, add it and set as current
                set({
                  currentSender: fullSender,
                  senders: [...senders, fullSender],
                })
              } else {
                // If in list, just set as current
                set({ currentSender: fullSender })
              }

              return
            }

            // Case 2: Find by ethereumAddress or inboxId
            let foundSender: CurrentSender | undefined

            if ("ethereumAddress" in sender) {
              foundSender = senders.find((s) => s.ethereumAddress === sender.ethereumAddress)
            } else if ("inboxId" in sender) {
              foundSender = senders.find((s) => s.inboxId === sender.inboxId)
            }

            if (!foundSender) {
              throw new Error(
                `No sender found matching the provided criteria: ${JSON.stringify(sender)}`,
              )
            }

            set({ currentSender: foundSender })
          },

          removeSender: (senderIdentifier) =>
            set((state) => {
              // Find the sender to remove
              let senderToRemove: CurrentSender | undefined

              if ("ethereumAddress" in senderIdentifier) {
                senderToRemove = state.senders.find(
                  (s) => s.ethereumAddress === senderIdentifier.ethereumAddress,
                )
              } else if ("inboxId" in senderIdentifier) {
                senderToRemove = state.senders.find((s) => s.inboxId === senderIdentifier.inboxId)
              }

              if (!senderToRemove) {
                return state
              }

              // Remove from senders list
              const newSenders = state.senders.filter(
                (s) => !isSameSender(s, senderToRemove as CurrentSender),
              )

              // Update current sender if needed
              const isRemovingCurrentSender =
                state.currentSender &&
                isSameSender(state.currentSender, senderToRemove as CurrentSender)

              const newCurrentSender = isRemovingCurrentSender
                ? newSenders.length > 0
                  ? newSenders[0]
                  : undefined
                : state.currentSender

              return {
                senders: newSenders,
                currentSender: newCurrentSender,
              }
            }),
        },
      }),
      {
        name: STORE_NAME,
        storage: createJSONStorage(() => zustandMMKVStorage),
        partialize: (state) => {
          // Remove the actions from partialized state
          const { actions, ...rest } = state
          return rest
        },
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            captureError(
              new GenericError({
                error,
                additionalMessage: "Error during multi-inbox store hydration",
              }),
            )
          } else {
            logger.debug(
              `Multi-inbox store hydrated successfully: ${JSON.stringify(state, null, 2)}`,
            )
          }
        },
      },
    ),
  ),
)

export function useCurrentSender() {
  return useMultiInboxStore((state) => state.currentSender)
}

export function getCurrentSender(): CurrentSender | undefined {
  return useMultiInboxStore.getState().currentSender
}

export function getSafeCurrentSender(): CurrentSender {
  const currentSender = getCurrentSender()
  if (!currentSender) {
    throw new Error("No current sender in getSafeCurrentSender")
  }
  return currentSender
}

export function useSafeCurrentSender(): CurrentSender {
  const currentSender = useCurrentSender()
  if (!currentSender) {
    throw new Error("No current sender in useSafeCurrentSender")
  }
  return currentSender
}

export function isCurrentSender(sender: Partial<CurrentSender>) {
  const currentSender = getSafeCurrentSender()
  if (!sender) return false
  return (
    currentSender.inboxId === sender.inboxId ||
    currentSender.ethereumAddress === sender.ethereumAddress
  )
}

export function useAllInboxIds() {
  return useMultiInboxStore((state) => state.senders.map((sender) => sender.inboxId))
}

export function resetMultiInboxStore() {
  useMultiInboxStore.getState().actions.reset()
}

export function getMultiInboxStoreSenders() {
  return useMultiInboxStore.getState().senders
}
