import { create, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import logger from "@utils/logger";
import { removeLogoutTask } from "@utils/logout";
import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";
import { ChatStoreType, initChatStore } from "./chatStore";
import {
  GroupStatus,
  initSettingsStore,
  SettingsStoreType,
} from "./settingsStore";
import { initWalletStore, WalletStoreType } from "./walletStore";
import {
  CurrentSender,
  MultiInboxClient,
} from "@/features/multi-inbox/multi-inbox.client";
import { useEffect, useState } from "react";

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

type AccountsStoreStype = {
  currentAccount: string;
  setCurrentAccount: (account: string, createIfNew: boolean) => void;
  accounts: string[];
  removeAccount: (account: string) => void;
};

export const TEMPORARY_ACCOUNT_NAME = "TEMPORARY_ACCOUNT";

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

initStores(TEMPORARY_ACCOUNT_NAME);

// Main accounts store
export const useAccountsStore = create<AccountsStoreStype>()(
  persist(
    (set) => ({
      currentAccount: TEMPORARY_ACCOUNT_NAME,
      accounts: [TEMPORARY_ACCOUNT_NAME],
      setCurrentAccount: (account, createIfNew) =>
        set((state) => {
          if (state.currentAccount === account) return state;
          const accounts = [...state.accounts];
          const isNew = !accounts.includes(account);

          if (isNew && !createIfNew) {
            logger.warn(
              `[AccountsStore] Account ${account} is new but createIfNew is false`
            );
            return state;
          }

          logger.debug(`[AccountsStore] Setting current account: ${account}`);

          if (!storesByAccount[account]) {
            initStores(account);
          }

          if (isNew) {
            accounts.push(account);
            removeLogoutTask(account);
            return { accounts };
          }

          return {
            currentAccount: account,
            accounts,
          };
        }),
      removeAccount: (accountToRemove) =>
        set((state) => {
          const newAccounts = [
            ...state.accounts.filter((a) => a !== accountToRemove),
          ];

          if (newAccounts.length === 0) {
            newAccounts.push(TEMPORARY_ACCOUNT_NAME);
          }

          deleteStores(accountToRemove);
          return {
            accounts: newAccounts,
          };
        }),
    }),
    {
      name: "store-accounts",
      storage: createJSONStorage(() => zustandMMKVStorage),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            logger.warn("An error happened during hydration", error);
          } else {
            if (state?.accounts && state.accounts.length > 0) {
              logger.debug("Accounts found in hydration, initializing stores");
              state.accounts.map(initStores);
            } else if (state) {
              logger.debug(
                "No accounts found in hydration, initializing temporary account"
              );
              state.currentAccount = TEMPORARY_ACCOUNT_NAME;
              state.accounts = [TEMPORARY_ACCOUNT_NAME];
            }
          }
        };
      },
    }
  )
);

const getAccountStore = (account: string) => {
  if (account in storesByAccount) {
    return storesByAccount[account];
  }
  return storesByAccount[TEMPORARY_ACCOUNT_NAME];
};

export const getAccountsList = () =>
  useAccountsStore
    .getState()
    .accounts.filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);

export const useAccountsList = () => {
  const accounts = useAccountsStore((s) => s.accounts);
  return accounts.filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);
};

export const currentAccount = (): string =>
  (useAccountsStore.getState() as AccountsStoreStype).currentAccount;

export const useCurrentAccount = () => {
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  return currentAccount === TEMPORARY_ACCOUNT_NAME ? undefined : currentAccount;
};

export const useSafeCurrentSender = (): CurrentSender => {
  const [currentSender, setCurrentSender] = useState<CurrentSender | undefined>(
    MultiInboxClient.instance.currentSender
  );

  if (!currentSender) {
    throw new Error("No current sender");
  }

  useEffect(() => {
    const unsubscribe =
      MultiInboxClient.instance.addCurrentInboxChangedObserver(
        ({ ethereumAddress, xmtpInboxId }) => {
          setCurrentSender({ ethereumAddress, xmtpInboxId });
        }
      );
    return () => unsubscribe();
  }, []);

  if (!currentSender) {
    throw new Error("No current sender");
  }
  return currentSender;
};

export function getCurrentAccount() {
  const currentAccount = useAccountsStore.getState().currentAccount;
  return currentAccount === TEMPORARY_ACCOUNT_NAME ? undefined : currentAccount;
}

const currentAccountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const currentAccount = useAccountsStore((s) => s.currentAccount);
    const accountStore = getAccountStore(currentAccount);
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[T];

  use.getState = () => {
    const currentAccountState = useAccountsStore.getState();
    const currentAccount = currentAccountState.currentAccount;
    const accountStore = getAccountStore(currentAccount);
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
  const account = currentAccount();
  if (!account) {
    logger.warn("[setGroupStatus] No current account");
    return;
  }
  const setGroupStatus = getSettingsStore(account).getState().setGroupStatus;
  setGroupStatus(groupStatus);
};
