import { ChatStoreType, initChatStore } from "@/data/store/chatStore";
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
import { logger } from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";
import { StoreApi, UseBoundStore, create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import {
  GroupStatus,
  SettingsStoreType,
  initSettingsStore,
} from "../../data/store/settingsStore";
import { WalletStoreType, initWalletStore } from "../../data/store/walletStore";
import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";

type AccountStoreDataType = {
  settings: SettingsStoreType;
  chat: ChatStoreType;
  wallet: WalletStoreType;
};

type AccountStoreType = {
  [K in keyof AccountStoreDataType]: UseBoundStore<
    StoreApi<AccountStoreDataType[K]>
  >;
};

const storesByAccount: {
  [account: string]: AccountStoreType;
} = {};

// Store initialization
export const initStores = (account: string) => {
  if (!(account in storesByAccount)) {
    logger.debug(`[multi-inbox store] Initiating account ${account}`);
    // If adding a persisted store here, please add
    // the deletion method in deleteStores
    storesByAccount[account] = {
      settings: initSettingsStore(account),
      chat: initChatStore(account),
      wallet: initWalletStore(account),
    };
  }
};

export const deleteStores = (account: string) => {
  logger.debug(`[multi-inbox store] Deleting account ${account}`);
  delete storesByAccount[account];
  mmkv.delete(`store-${account}-chat`);
  mmkv.delete(`store-${account}-settings`);
  mmkv.delete(`store-${account}-wallet`);
};

type AccountsStoreStype = {
  multiInboxClientRestorationState: MultiInboxClientRestorationState;
  setMultiInboxClientRestorationState: (
    state: MultiInboxClientRestorationState
  ) => void;
  currentSender: CurrentSender | undefined;

  setCurrentAccount: ({ ethereumAddress }: { ethereumAddress: string }) => void;
  setCurrentInboxId: (inboxId: InboxId) => void;
  setCurrentSender: (sender: CurrentSender | undefined) => void;

  addSender: (sender: CurrentSender) => void;
  // setCurrentAccount: (ethereumAddress: string) => void;
  senders: CurrentSender[];
  logoutAllSenders: () => void;
};

// Main accounts store
export const useAccountsStore = create<AccountsStoreStype>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        currentSender: undefined,
        signedInUserId: undefined,
        setCurrentAccount: ({
          ethereumAddress,
        }: {
          ethereumAddress: string;
        }) => {
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

        setCurrentSender: (sender: CurrentSender | undefined) =>
          set({ currentSender: sender }),
        multiInboxClientRestorationState:
          MultiInboxClientRestorationStates.idle,
        setMultiInboxClientRestorationState: (
          state: MultiInboxClientRestorationState
        ) => set({ multiInboxClientRestorationState: state }),
        addSender: (sender: CurrentSender) =>
          set((state) => {
            if (!storesByAccount[sender.ethereumAddress]) {
              initStores(sender.ethereumAddress);
            }
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
        partialize: (state) => {
          const partializedState = {
            ...state,
            multiInboxClientRestorationState:
              MultiInboxClientRestorationStates.idle,
          };
          return partializedState;
        },

        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              logger.warn(
                `[multi-inbox.store#onRehydrationStorage] An error happened during hydration: ${error}`
              );
            } else {
              logger.debug(
                `[multi-inbox.store#onRehydrationStorage] State hydrated successfully: ${JSON.stringify(
                  state,
                  null,
                  2
                )}`
              );
              if (state?.senders && state.senders.length > 0) {
                logger.debug(
                  `[multi-inbox.store#onRehydrationStorage] Found ${state.senders.length} accounts in hydration, initializing stores`
                );
                state.senders.map((sender) => {
                  if (!storesByAccount[sender.ethereumAddress]) {
                    logger.debug(
                      `[multi-inbox.store#onRehydrationStorage] Initializing store for account: ${sender.ethereumAddress}`
                    );
                    initStores(sender.ethereumAddress);
                  } else {
                    logger.debug(
                      `[multi-inbox.store#onRehydrationStorage] Store already exists for account: ${sender.ethereumAddress}`
                    );
                  }
                });
              } else {
                logger.debug(
                  "[multi-inbox.store#onRehydrationStorage] No accounts found in hydrated state"
                );
              }
            }
          };
        },
      }
    )
  )
);

const getAccountStore = (account: string) => {
  if (!account) {
    throw new Error("No account provided");
  }

  if (account in storesByAccount) {
    return storesByAccount[account];
  }
  throw new Error(`No account store found for ${account}`);
};

export const getAccountsList = () =>
  useAccountsStore.getState().senders.map((sender) => sender.ethereumAddress);

/**
 * @deprecated We should index by ID instead of ethereum address
 */
export const useAccountsList = () => {
  const senders = useAccountsStore((state) => state.senders);
  return senders
    .filter((sender) => Boolean(sender.ethereumAddress))
    .map((sender) => sender.ethereumAddress);
};

export const useSafeActiveSenderProfile = () => {
  const { inboxId: currentInboxId } = useSafeCurrentSender();
  const senders = useAccountsStore.getState().senders;
  const sender = senders.find((sender) => sender.inboxId === currentInboxId);
  const xmtpId = sender?.inboxId;
  return useProfileQuery({ xmtpId });
};

export const useCurrentProfile = () => {
  const currentSender = useCurrentSender();
  return useProfileQuery({ xmtpId: currentSender?.inboxId });
};

export const useCurrentProfiles = () => {
  const senders = useAccountsStore((state) => state.senders);
  const inboxIdsForCurrentInboxes = senders.map((sender) => sender.inboxId);
  const { data: currentProfiles, isLoading: isLoadingProfiles } =
    useProfilesQueries({
      xmtpInboxIds: inboxIdsForCurrentInboxes,
    });
  const truthyProfiles = currentProfiles?.filter(Boolean);
  return { currentProfiles: truthyProfiles, isLoadingProfiles };
};

export const useCurrentAccount = () => {
  const currentSender = useCurrentSender();
  return currentSender?.ethereumAddress;
};

export const getCurrentSender = (): CurrentSender | undefined => {
  return useAccountsStore.getState().currentSender;
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

export const useCurrentSender: () => CurrentSender | undefined = () => {
  return useAccountsStore((s) => s.currentSender);
};

export function getCurrentAccount() {
  const currentSender = useAccountsStore.getState().currentSender;

  return currentSender?.ethereumAddress;
}

export function isCurrentSender(sender: Partial<ConvosSender>) {
  const currentSender = getSafeCurrentSender();
  if (!sender) return false;
  return (
    currentSender.inboxId === sender.inboxId ||
    currentSender.ethereumAddress === sender.ethereumAddress
  );
}

const currentAccountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const currentSender = useAccountsStore((s) => s.currentSender);
    const currentEthereumAddress = currentSender?.ethereumAddress;
    if (!currentEthereumAddress) {
      // throw new Error("No current sender");
      return {
        getState: () => {
          return {
            [key]: {} as AccountStoreDataType[T],
          };
        },
      };
    }
    const accountStore = getAccountStore(currentEthereumAddress);
    if (!accountStore) {
      // throw new Error("No account store found");
      return {
        getState: () => {
          return {
            [key]: {} as AccountStoreDataType[T],
          };
        },
      };
    }
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[T];

  use.getState = () => {
    const currentAccountState = useAccountsStore.getState();
    const currentEthereumAddress =
      currentAccountState.currentSender?.ethereumAddress;
    if (!currentEthereumAddress) {
      throw new Error("No current sender");
    }
    const accountStore = getAccountStore(currentEthereumAddress);
    return accountStore[key].getState();
  };

  return use;
};

// Store exports
export const useSettingsStore = currentAccountStoreHook("settings");
export const getSettingsStore = (account: string) =>
  getAccountStore(account).settings;
export const useChatStore = currentAccountStoreHook("chat");
export const getWalletStore = (account: string) =>
  getAccountStore(account).wallet;

// Group status helper
export const setGroupStatus = (groupStatus: GroupStatus) => {
  const account = getCurrentAccount();
  if (!account) {
    logger.warn("[setGroupStatus] No current account");
    return;
  }
  const setGroupStatus = getSettingsStore(account).getState().setGroupStatus;
  setGroupStatus(groupStatus);
};

export function useAllInboxIds() {
  return useAccountsStore.getState().senders.map((sender) => sender.inboxId);
}

export { MultiInboxClientRestorationStates };

export function clearAllStores() {
  // Get list of all accounts
  const senders = useAccountsStore.getState().senders;

  // Delete stores for each account
  senders.forEach((sender) => {
    deleteStores(sender.ethereumAddress);
  });

  // Clear all senders and current sender
  useAccountsStore.getState().logoutAllSenders();
}
