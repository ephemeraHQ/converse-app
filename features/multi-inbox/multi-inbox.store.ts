import {
  ConvosSender,
  CurrentSender,
  MultiInboxClientRestorationState,
  MultiInboxClientRestorationStates,
} from "@/features/multi-inbox/multi-inbox-client.types";
import {
  useProfileQuery,
  useProfilesQueries,
} from "@/features/profiles/profiles.query";
import mmkv, { zustandMMKVStorage } from "@/utils/mmkv";
import { logger } from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

// First, let's define the missing types and remove unused ones

type IMultiInboxStoreType = {
  multiInboxClientRestorationState: MultiInboxClientRestorationState;
  setMultiInboxClientRestorationState: (
    state: MultiInboxClientRestorationState
  ) => void;
  currentSender: CurrentSender | undefined;
  setCurrentAccount: ({ ethereumAddress }: { ethereumAddress: string }) => void;
  setCurrentInboxId: (inboxId: InboxId) => void;
  setCurrentSender: (sender: CurrentSender | undefined) => void;
  addSender: (sender: CurrentSender) => void;
  senders: CurrentSender[];
  logoutAllSenders: () => void;
};

// Remove unused stores map since we only have one store now
const useMultiInboxStore = create<IMultiInboxStoreType>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        currentSender: undefined,
        setCurrentAccount: ({ ethereumAddress }) => {
          const senders = get().senders;
          const sender = senders.find(
            (sender) => sender.ethereumAddress === ethereumAddress
          );
          if (!sender) {
            throw new Error("Sender not found");
          }
          set({ currentSender: sender });
        },

        setCurrentInboxId: (inboxId: InboxId) => {
          const senders = get().senders;
          const sender = senders.find((sender) => sender.inboxId === inboxId);
          if (!sender) {
            throw new Error("Sender not found");
          }
          set({ currentSender: sender });
        },

        setCurrentSender: (sender) => set({ currentSender: sender }),
        multiInboxClientRestorationState:
          MultiInboxClientRestorationStates.idle,
        setMultiInboxClientRestorationState: (state) =>
          set({ multiInboxClientRestorationState: state }),

        addSender: (sender) =>
          set((state) => {
            const senderExists = state.senders.some(
              (existingSender) =>
                existingSender.ethereumAddress === sender.ethereumAddress &&
                existingSender.inboxId === sender.inboxId
            );
            if (senderExists) return state;
            return { senders: [...state.senders, sender] };
          }),

        senders: [],
        logoutAllSenders: () => {
          set({ senders: [], currentSender: undefined });
        },
      }),
      {
        name: "multi-inbox-store",
        storage: createJSONStorage(() => zustandMMKVStorage),
        partialize: (state) => ({
          ...state,
          multiInboxClientRestorationState:
            MultiInboxClientRestorationStates.idle,
        }),

        onRehydrateStorage: () => (state, error) => {
          if (error) {
            logger.warn(
              `[multi-inbox.store#onRehydrationStorage] An error happened during hydration: ${error}`
            );
            return;
          }

          logger.debug(
            `[multi-inbox.store#onRehydrationStorage] State hydrated successfully: ${JSON.stringify(
              state,
              null,
              2
            )}`
          );
        },
      }
    )
  )
);

export const useSafeCurrentSenderProfile = () => {
  const { inboxId: currentInboxId } = useSafeCurrentSender();
  const senders = useMultiInboxStore.getState().senders;
  const sender = senders.find((sender) => sender.inboxId === currentInboxId);
  const xmtpId = sender?.inboxId;
  return useProfileQuery({ xmtpId });
};

export const useCurrentSenderProfile = () => {
  const currentSender = useCurrentSender();
  return useProfileQuery({ xmtpId: currentSender?.inboxId });
};

export const useCurrentProfiles = () => {
  const senders = useMultiInboxStore((state) => state.senders);
  const inboxIdsForCurrentInboxes = senders.map((sender) => sender.inboxId);
  const { data: currentProfiles, isLoading: isLoadingProfiles } =
    useProfilesQueries({
      xmtpInboxIds: inboxIdsForCurrentInboxes,
    });
  const truthyProfiles = currentProfiles?.filter(Boolean);
  return { currentProfiles: truthyProfiles, isLoadingProfiles };
};

export const useCurrentSenderEthAddress = () => {
  const currentSender = useCurrentSender();
  return currentSender?.ethereumAddress;
};

export const getCurrentSender = (): CurrentSender | undefined => {
  return useMultiInboxStore.getState().currentSender;
};

export const getSafeCurrentSender = (): CurrentSender => {
  const currentSender = getCurrentSender();
  if (!currentSender) {
    throw new Error("No current sender");
  }
  return currentSender;
};

export const useSafeCurrentSender = (): CurrentSender => {
  const currentSender = useCurrentSender();
  if (!currentSender) {
    throw new Error("No current sender");
  }
  return currentSender;
};

export const useCurrentSender = () => {
  return useMultiInboxStore((s) => s.currentSender);
};

export const isCurrentSender = (sender: Partial<ConvosSender>) => {
  const currentSender = getSafeCurrentSender();
  if (!sender) return false;
  return (
    currentSender.inboxId === sender.inboxId ||
    currentSender.ethereumAddress === sender.ethereumAddress
  );
};

export const useAllInboxIds = () => {
  return useMultiInboxStore.getState().senders.map((sender) => sender.inboxId);
};

export { MultiInboxClientRestorationStates };

export const clearAllStores = () => {
  useMultiInboxStore.getState().logoutAllSenders();
  mmkv.clearAll();
};
