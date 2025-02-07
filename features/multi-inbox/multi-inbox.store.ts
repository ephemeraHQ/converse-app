import { create, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import logger from "@utils/logger";
import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";
import { ChatStoreType, initChatStore } from "../../data/store/chatStore";
import {
  GroupStatus,
  initSettingsStore,
  SettingsStoreType,
} from "../../data/store/settingsStore";
import { initWalletStore, WalletStoreType } from "../../data/store/walletStore";
import {
  CurrentSender,
  MultiInboxClientRestorationState,
  MultiInboxClientRestorationStates,
} from "@/features/multi-inbox/multi-inbox-client.types";

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
    logger.debug(`[AccountsStore] Initiating account ${account}`);
    // If adding a persisted store here, please add
    // the deletion method in deleteStores
    storesByAccount[account] = {
      settings: initSettingsStore(account),
      chat: initChatStore(account),
      wallet: initWalletStore(account),
    };
  }
};

const deleteStores = (account: string) => {
  logger.debug(`[AccountsStore] Deleting account ${account}`);
  delete storesByAccount[account];
  mmkv.delete(`store-${account}-chat`);
  mmkv.delete(`store-${account}-settings`);
  mmkv.delete(`store-${account}-wallet`);
};

export const AuthStatuses = {
  signedIn: "signedIn",
  signedOut: "signedOut",
  undetermined: "undetermined",
} as const;

type AuthStatus = (typeof AuthStatuses)[keyof typeof AuthStatuses];

type AccountsStoreStype = {
  authStatus: AuthStatus;
  setAuthStatus: (status: AuthStatus) => void;
  multiInboxClientRestorationState: MultiInboxClientRestorationState;
  setMultiInboxClientRestorationState: (
    state: MultiInboxClientRestorationState
  ) => void;
  currentSender: CurrentSender | undefined;

  setCurrentAccount: ({ ethereumAddress }: { ethereumAddress: string }) => void;

  setCurrentSender: (sender: CurrentSender | undefined) => void;
  addSender: (sender: CurrentSender) => void;
  // setCurrentAccount: (ethereumAddress: string) => void;
  senders: CurrentSender[];
  logoutAllSenders: () => void;
};
// Main accounts store
export const useAccountsStore = create<AccountsStoreStype>()(
  persist(
    (set, get) => ({
      authStatus: AuthStatuses.undetermined,
      setAuthStatus: (status: AuthStatus) => set({ authStatus: status }),

      currentSender: undefined,

      setCurrentAccount: ({ ethereumAddress }: { ethereumAddress: string }) => {
        const senders = get().senders;
        const sender = senders.find(
          (sender) => sender.ethereumAddress === ethereumAddress
        );
        if (!sender) {
          throw new Error("Sender not found");
        }
        set({ currentSender: sender });
      },

      setCurrentSender: (sender: CurrentSender | undefined) =>
        set({ currentSender: sender }),
      multiInboxClientRestorationState: MultiInboxClientRestorationStates.idle,
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
      name: "store-accounts",
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        ...state,
        multiInboxClientRestorationState:
          MultiInboxClientRestorationStates.idle,
      }),

      onRehydrateStorage: () => {
        logger.debug("[onRehydrateStorage] Starting hydration");
        return (state, error) => {
          if (error) {
            logger.warn(
              `[onRehydrateStorage] An error happened during hydration: ${error}`
            );
          } else {
            logger.debug(
              `[onRehydrateStorage] State hydrated successfully: ${JSON.stringify(
                state
              )}`
            );
            if (state?.senders && state.senders.length > 0) {
              logger.debug(
                `[onRehydrateStorage] Found ${state.senders.length} accounts in hydration, initializing stores`
              );
              state.senders.map((sender) => {
                if (!storesByAccount[sender.ethereumAddress]) {
                  logger.debug(
                    `[onRehydrateStorage] Initializing store for account: ${sender.ethereumAddress}`
                  );
                  initStores(sender.ethereumAddress);
                } else {
                  logger.debug(
                    `[onRehydrateStorage] Store already exists for account: ${sender.ethereumAddress}`
                  );
                }
              });
            } else {
              logger.debug(
                "[onRehydrateStorage] No accounts found in hydrated state"
              );
            }
          }
        };
      },
    }
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

export const useCurrentAccount = () => {
  const currentSender = useCurrentSender();
  return currentSender?.ethereumAddress;
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

const currentAccountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const currentSender = useAccountsStore((s) => s.currentSender);
    const currentEthereumAddress = currentSender?.ethereumAddress;
    if (!currentEthereumAddress) {
      throw new Error("No current sender");
    }
    const accountStore = getAccountStore(currentEthereumAddress);
    if (!accountStore) {
      throw new Error("No account store found");
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
