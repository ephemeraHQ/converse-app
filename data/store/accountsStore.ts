import logger from "@utils/logger";
import { v4 as uuidv4 } from "uuid";
import { create, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ChatStoreType, initChatStore } from "./chatStore";
import { InboxIdStoreType, initInboxIdStore } from "./inboxIdStore";
import { initProfilesStore, ProfilesStoreType } from "./profilesStore";
import {
  initRecommendationsStore,
  RecommendationsStoreType,
} from "./recommendationsStore";
import { initSettingsStore, SettingsStoreType } from "./settingsStore";
import {
  initTransactionsStore,
  TransactionsStoreType,
} from "./transactionsStore";
import { initWalletStore, WalletStoreType } from "./walletStore";
import { removeLogoutTask } from "../../utils/logout";
import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";
import { updateSteps } from "../updates/asyncUpdates";

type AccountStoreType = {
  [K in keyof AccountStoreDataType]: UseBoundStore<
    StoreApi<AccountStoreDataType[K]>
  >;
};

const storesByAccount: {
  [account: string]: AccountStoreType;
} = {};

// And here call the init method of each store
export const initStores = (account: string) => {
  if (!(account in storesByAccount)) {
    logger.debug(`[AccountsStore] Initiating account ${account}`);
    // If adding a persisted store here, please add
    // the deletion method in deleteStores
    storesByAccount[account] = {
      profiles: initProfilesStore(account),
      settings: initSettingsStore(account),
      recommendations: initRecommendationsStore(account),
      chat: initChatStore(account),
      wallet: initWalletStore(account),
      transactions: initTransactionsStore(account),
      inboxId: initInboxIdStore(account),
    };
  }
};

const deleteStores = (account: string) => {
  logger.debug(`[AccountsStore] Deleting account ${account}`);
  delete storesByAccount[account];
  mmkv.delete(`store-${account}-chat`);
  mmkv.delete(`store-${account}-recommendations`);
  mmkv.delete(`store-${account}-settings`);
  mmkv.delete(`store-${account}-wallet`);
  mmkv.delete(`store-${account}-transactions`);
};

export const TEMPORARY_ACCOUNT_NAME = "TEMPORARY_ACCOUNT";

initStores(TEMPORARY_ACCOUNT_NAME);

export const getAccountsList = () =>
  useAccountsStore
    .getState()
    .accounts.filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);

export const useAccountsList = () => {
  const accounts = useAccountsStore((s) => s.accounts);
  return accounts.filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);
};

export const useErroredAccountsMap = () => {
  const accounts = useAccountsList();
  return accounts.reduce(
    (acc, a) => {
      const errored = getChatStore(a).getState().errored;
      if (errored) {
        acc[a] = errored;
      }
      return acc;
    },
    {} as { [account: string]: boolean }
  );
};

// This store is global (i.e. not linked to an account)
// For now we only use a single account so we initialize it
// and don't add a setter.

type AccountsStoreStype = {
  currentAccount: string;
  setCurrentAccount: (account: string, createIfNew: boolean) => void;
  accounts: string[];
  removeAccount: (account: string) => void;
  databaseId: { [account: string]: string };
  setDatabaseId: (account: string, id: string) => void;
  resetDatabaseId: (account: string) => void;
  privyAccountId: { [account: string]: string | undefined };
  setPrivyAccountId: (account: string, id: string | undefined) => void;
};

export const useAccountsStore = create<AccountsStoreStype>()(
  persist(
    (set) => ({
      currentAccount: TEMPORARY_ACCOUNT_NAME,
      accounts: [TEMPORARY_ACCOUNT_NAME],
      privyAccountId: {},
      setPrivyAccountId: (account, id) =>
        set((state) => {
          const privyAccountId = { ...state.privyAccountId };
          privyAccountId[account] = id;
          return { privyAccountId };
        }),
      databaseId: {},
      setDatabaseId: (account, id) =>
        set((state) => {
          const databaseId = { ...state.databaseId };
          databaseId[account] = id;
          return { databaseId };
        }),
      resetDatabaseId: (account) =>
        set((state) => {
          const databaseId = { ...state.databaseId };
          databaseId[account] = uuidv4();
          return { databaseId };
        }),
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
          const databaseId = { ...state.databaseId };
          if (isNew) {
            accounts.push(account);
            databaseId[account] = uuidv4();
            removeLogoutTask(account);
            // Init lastAsyncUpdate so no async migration is run for new accounts
            getSettingsStore(account)
              .getState()
              .setLastAsyncUpdate(updateSteps.length);
            return {
              // No setting anymore because we want to refresh profile first
              // currentAccount: account,
              accounts,
              databaseId,
            };
          }
          return {
            currentAccount: account,
            accounts,
            databaseId,
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

          // New current account doesn't change if it's not the one to remove,
          // else we find the first non temporary one and fallback to temporary (= logout)
          const newCurrentAccount =
            state.currentAccount === accountToRemove
              ? newAccounts.find((a) => a !== TEMPORARY_ACCOUNT_NAME) ||
                TEMPORARY_ACCOUNT_NAME
              : state.currentAccount;

          const newDatabaseId = { ...state.databaseId };
          delete newDatabaseId[accountToRemove];
          deleteStores(accountToRemove);
          return {
            accounts: newAccounts,
            currentAccount: newCurrentAccount,
            databaseId: newDatabaseId,
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
              state.accounts.map(initStores);
            } else if (state) {
              state.currentAccount = TEMPORARY_ACCOUNT_NAME;
              state.accounts = [TEMPORARY_ACCOUNT_NAME];
            }
          }
        };
      },
    }
  )
);

// Each account gets multiple substores! Here we define the substore types and
// getters / setters / helpers to manage these multiple stores for each account

// Add here the type of each store data
type AccountStoreDataType = {
  profiles: ProfilesStoreType;
  settings: SettingsStoreType;
  recommendations: RecommendationsStoreType;
  chat: ChatStoreType;
  wallet: WalletStoreType;
  transactions: TransactionsStoreType;
  inboxId: InboxIdStoreType;
};

const getAccountStore = (account: string) => {
  if (account in storesByAccount) {
    return storesByAccount[account];
  } else {
    return storesByAccount[TEMPORARY_ACCOUNT_NAME];
  }
};

export const currentAccount = () => useAccountsStore.getState().currentAccount;
export const useCurrentAccount = () => {
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  return currentAccount === TEMPORARY_ACCOUNT_NAME ? undefined : currentAccount;
};

export const loggedWithPrivy = () => {
  const account = currentAccount();
  return isPrivyAccount(account);
};

export const isPrivyAccount = (account: string) => {
  return !!useAccountsStore.getState().privyAccountId[account];
};

export const useLoggedWithPrivy = () => {
  const account = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);
  return account ? !!privyAccountId[account] : false;
};

export const useHasOnePrivyAccount = () => {
  const accountsState = useAccountsStore();
  let hasOne = undefined as string | undefined;
  accountsState.accounts.forEach((a) => {
    if (a !== TEMPORARY_ACCOUNT_NAME && accountsState.privyAccountId[a]) {
      hasOne = a;
    }
  });
  return hasOne;
};

// This enables us to use account-based substores for the current selected user automatically,
// Just call export useSubStore = accountStoreHook("subStoreName") in the substore definition

const currentAccountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
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

const accountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T,
  account: string
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    const accountStore = getAccountStore(account);
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[T];
  use.getState = () => {
    const accountStore = getAccountStore(account);
    return accountStore[key].getState();
  };
  return use;
};

export const useProfilesStore = currentAccountStoreHook("profiles");
export const useProfilesStoreForAccount = (account: string) =>
  accountStoreHook("profiles", account);
export const getProfilesStore = (account: string) =>
  getAccountStore(account).profiles;

export const useSettingsStore = currentAccountStoreHook("settings");
export const useSettingsStoreForAccount = (account: string) =>
  accountStoreHook("settings", account);
export const getSettingsStore = (account: string) =>
  getAccountStore(account).settings;

export const useRecommendationsStore =
  currentAccountStoreHook("recommendations");
export const useRecommendationsStoreForAccount = (account: string) =>
  accountStoreHook("recommendations", account);
export const getRecommendationsStore = (account: string) =>
  getAccountStore(account).recommendations;

export const useChatStore = currentAccountStoreHook("chat");
export const useChatStoreForAccount = (account: string) =>
  accountStoreHook("chat", account);
export const getChatStore = (account: string) => getAccountStore(account).chat;

export const useWalletStore = currentAccountStoreHook("wallet");
export const useWalletStoreForAccount = (account: string) =>
  accountStoreHook("wallet", account);
export const getWalletStore = (account: string) =>
  getAccountStore(account).wallet;

export const useTransactionsStore = currentAccountStoreHook("transactions");
export const useTransactionsStoreForAccount = (account: string) =>
  accountStoreHook("transactions", account);
export const getTransactionsStore = (account: string) =>
  getAccountStore(account).transactions;

export const useInboxIdStore = currentAccountStoreHook("inboxId");
export const useInboxIdStoreForAccount = (account: string) =>
  accountStoreHook("inboxId", account);
export const getInboxIdStore = (account: string) =>
  getAccountStore(account).inboxId;
