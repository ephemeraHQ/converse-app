import { logger } from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import {
  useProfileQuery,
  useProfilesQueries,
} from "@/features/profiles/profiles.query";
import { captureError } from "@/utils/capture-error";
import { enhanceError } from "@/utils/error";
import { zustandMMKVStorage } from "@/utils/mmkv";

export type CurrentSender = {
  ethereumAddress: string;
  inboxId: string;
};

type IMultiInboxStoreState = {
  currentSender: CurrentSender | undefined;
  senders: CurrentSender[];
};

type IMultiInboxStoreActions = {
  reset: () => void;
  setCurrentSender: (
    sender: // We let users pass in a partial CurrentSender object and we will find the full object in the store using "senders"
    | CurrentSender
      | { ethereumAddress: string }
      | { inboxId: InboxId }
      | undefined,
  ) => void;
  addSender: (sender: CurrentSender) => void;
};

// Combine State and Actions for the store type
type IMultiInboxStoreType = IMultiInboxStoreState & {
  actions: IMultiInboxStoreActions;
};

const initialState: IMultiInboxStoreState = {
  currentSender: undefined,
  senders: [],
};

// Changing this will break existing users as the store won't be able to hydrate
// So users will be logged out on new app load
const STORE_NAME = "multi-inbox-store";

export const useMultiInboxStore = create<IMultiInboxStoreType>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        actions: {
          reset: () => {
            set(initialState);
            zustandMMKVStorage.removeItem(STORE_NAME);
          },

          setCurrentSender: (sender) => {
            if (!sender) {
              return set({ currentSender: undefined });
            }

            // If it's a full CurrentSender object, set it directly
            if ("ethereumAddress" in sender && "inboxId" in sender) {
              return set({ currentSender: sender });
            }

            const senders = get().senders;

            // Find by ethereumAddress
            if ("ethereumAddress" in sender) {
              const found = senders.find(
                (s) => s.ethereumAddress === sender.ethereumAddress,
              );
              if (!found) {
                throw new Error(
                  `No sender found with ethereum address: ${sender.ethereumAddress}`,
                );
              }
              return set({ currentSender: found });
            }

            // Find by inboxId
            if ("inboxId" in sender) {
              const found = senders.find((s) => s.inboxId === sender.inboxId);
              if (!found) {
                throw new Error(
                  `No sender found with inbox ID: ${sender.inboxId}`,
                );
              }
              return set({ currentSender: found });
            }
          },

          addSender: (sender) =>
            set((state) => {
              const senderExists = state.senders.some(
                (existingSender) =>
                  existingSender.ethereumAddress === sender.ethereumAddress &&
                  existingSender.inboxId === sender.inboxId,
              );
              if (senderExists) return state;
              return { senders: [...state.senders, sender] };
            }),
        },
      }),
      {
        name: STORE_NAME,
        storage: createJSONStorage(() => zustandMMKVStorage),
        partialize: (state) => {
          // Remove the actions from partialized state
          const { actions, ...rest } = state;
          return rest;
        },
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            captureError(
              enhanceError(error, "Error during multi-inbox store hydration"),
            );
            return;
          }
          logger.debug(
            `[useMultiInboxStore#onRehydrateStorage] State hydrated successfully: ${JSON.stringify(
              state,
              null,
              2,
            )}`,
          );
        },
      },
    ),
  ),
);

export function useSafeCurrentSenderProfile() {
  const { inboxId: currentInboxId } = useSafeCurrentSender();
  const senders = useMultiInboxStore.getState().senders;
  const sender = senders.find((sender) => sender.inboxId === currentInboxId);
  const xmtpId = sender?.inboxId;
  return useProfileQuery({ xmtpId });
}

export function useCurrentSenderProfile() {
  const currentSender = useCurrentSender();
  return useProfileQuery({ xmtpId: currentSender?.inboxId });
}

export function useCurrentProfiles() {
  const senders = useMultiInboxStore((state) => state.senders);
  const inboxIdsForCurrentInboxes = senders.map((sender) => sender.inboxId);
  const { data: currentProfiles, isLoading: isLoadingProfiles } =
    useProfilesQueries({
      xmtpInboxIds: inboxIdsForCurrentInboxes,
    });
  const truthyProfiles = currentProfiles?.filter(Boolean);
  return { currentProfiles: truthyProfiles, isLoadingProfiles };
}

export function useCurrentSenderEthAddress() {
  const currentSender = useCurrentSender();
  return currentSender?.ethereumAddress;
}

export function getCurrentSenderEthAddress() {
  const currentSender = useMultiInboxStore.getState().currentSender;
  return currentSender?.ethereumAddress;
}

export function getCurrentSender(): CurrentSender | undefined {
  return useMultiInboxStore.getState().currentSender;
}

export function getSafeCurrentSender(): CurrentSender {
  const currentSender = getCurrentSender();
  if (!currentSender) {
    throw new Error("No current sender");
  }
  return currentSender;
}

export function useSafeCurrentSender(): CurrentSender {
  const currentSender = useCurrentSender();
  if (!currentSender) {
    throw new Error("No current sender");
  }
  return currentSender;
}

export function useCurrentSender() {
  return useMultiInboxStore((s) => s.currentSender);
}

export function isCurrentSender(sender: Partial<CurrentSender>) {
  const currentSender = getSafeCurrentSender();
  if (!sender) return false;
  return (
    currentSender.inboxId === sender.inboxId ||
    currentSender.ethereumAddress === sender.ethereumAddress
  );
}

export function useAllInboxIds() {
  return useMultiInboxStore.getState().senders.map((sender) => sender.inboxId);
}

export function resetAccountStore() {
  useMultiInboxStore.getState().actions.reset();
}

export function getSenderWithInboxId(inboxId: InboxId) {
  return useMultiInboxStore
    .getState()
    .senders.find((sender) => sender.inboxId === inboxId);
}
