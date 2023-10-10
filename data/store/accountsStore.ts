import uuid from "react-native-uuid";
import { create, StoreApi, UseBoundStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { removeLogoutTask } from "../../utils/logout";
import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";
import { ChatStoreType, initChatStore } from "./chatStore";
import { ProfilesStoreType, initProfilesStore } from "./profilesStore";
import {
  initRecommendationsStore,
  RecommendationsStoreType,
} from "./recommendationsStore";
import { initSettingsStore, SettingsStoreType } from "./settingsStore";

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
    console.log(`[AccountsStore] Initiating account ${account}`);
    // If adding a persisted store here, please add
    // the deletion method in deleteStores
    storesByAccount[account] = {
      profiles: initProfilesStore(),
      settings: initSettingsStore(account),
      recommendations: initRecommendationsStore(account),
      chat: initChatStore(account),
    };
  }
};

const deleteStores = (account: string) => {
  console.log(`[AccountsStore] Deleting account ${account}`);
  delete storesByAccount[account];
  mmkv.delete(`store-${account}-chat`);
  mmkv.delete(`store-${account}-recommendations`);
  mmkv.delete(`store-${account}-settings`);
};

export const TEMPORARY_ACCOUNT_NAME = "TEMPORARY_ACCOUNT";

initStores(TEMPORARY_ACCOUNT_NAME);

export const getAccountsList = () =>
  Object.keys(storesByAccount).filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);

export const useAccountsList = () => {
  const accounts = useAccountsStore((s) => s.accounts);
  return accounts.filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);
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
  resetDatabaseId: (account: string) => void;
};

export const useAccountsStore = create<AccountsStoreStype>()(
  persist(
    (set) => ({
      currentAccount: TEMPORARY_ACCOUNT_NAME,
      accounts: [TEMPORARY_ACCOUNT_NAME],
      databaseId: {},
      resetDatabaseId: (account) =>
        set((state) => {
          const databaseId = { ...state.databaseId };
          databaseId[account] = uuid.v4().toString();
          return { databaseId };
        }),
      setCurrentAccount: (account, createIfNew) =>
        set((state) => {
          if (state.currentAccount === account) return state;
          const accounts = [...state.accounts];
          const isNew = !accounts.includes(account);
          if (isNew && !createIfNew) {
            console.error(
              `[AccountsStore] Account ${account} is new but createIfNew is false`
            );
            return state;
          }
          console.log(`[AccountsStore] Setting current account: ${account}`);
          if (!storesByAccount[account]) {
            initStores(account);
          }
          const databaseId = { ...state.databaseId };
          if (isNew) {
            accounts.push(account);
            databaseId[account] = uuid.v4().toString();
            removeLogoutTask(account);
          }
          return { currentAccount: account, accounts, databaseId };
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
            console.log("An error happened during hydration", error);
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
};

const getAccountStore = (account: string) => {
  if (account in storesByAccount) {
    return storesByAccount[account];
  } else {
    throw new Error(`Tried to access non existent store for ${account}`);
  }
};

export const currentAccount = () => useAccountsStore.getState().currentAccount;
export const useCurrentAccount = () => {
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  return currentAccount;
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

export const useProfilesStore = currentAccountStoreHook("profiles");
export const getProfilesStore = (account: string) =>
  getAccountStore(account).profiles;

export const useSettingsStore = currentAccountStoreHook("settings");
export const getSettingsStore = (account: string) =>
  getAccountStore(account).settings;

export const useRecommendationsStore =
  currentAccountStoreHook("recommendations");
export const getRecommendationsStore = (account: string) =>
  getAccountStore(account).recommendations;

export const useChatStore = currentAccountStoreHook("chat");
export const getChatStore = (account: string) => getAccountStore(account).chat;
