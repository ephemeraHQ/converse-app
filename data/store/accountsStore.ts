import { create, StoreApi, UseBoundStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";
import { ChatStoreType, initChatStore } from "./chatStore";
import { ProfilesStoreType, initProfilesStore } from "./profilesStore";
import {
  initRecommendationsStore,
  RecommendationsStoreType,
} from "./recommendationsStore";
import { initSettingsStore, SettingsStoreType } from "./settingsStore";
import { initUserStore, UserStoreType } from "./userStore";

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
      user: initUserStore(),
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

initStores("TEMPORARY_ACCOUNT");

export const getAccounts = () =>
  Object.keys(storesByAccount).filter((a) => a !== "TEMPORARY_ACCOUNT");

// This store is global (i.e. not linked to an account)
// For now we only use a single account so we initialize it
// and don't add a setter.

type AccountsStoreStype = {
  currentAccount: string;
  setCurrentAccount: (account: string) => void;
  accounts: string[];
  removeAccount: (account: string) => void;
};

export const useAccountsStore = create<AccountsStoreStype>()(
  persist(
    (set) => ({
      currentAccount: "TEMPORARY_ACCOUNT",
      accounts: ["TEMPORARY_ACCOUNT"],
      setCurrentAccount: (account) =>
        set((state) => {
          console.log(`[AccountsStore] Setting current account: ${account}`);
          if (!storesByAccount[account]) {
            initStores(account);
          }
          const accounts = state.accounts;
          if (!accounts.includes(account)) {
            accounts.push(account);
          }
          return { currentAccount: account, accounts };
        }),
      removeAccount: (account) =>
        set((state) => {
          const newAccounts = [...state.accounts.filter((a) => a !== account)];
          if (newAccounts.length === 0) {
            newAccounts.push("TEMPORARY_ACCOUNT");
          }
          const newCurrentAccount =
            state.currentAccount === account
              ? newAccounts[0]
              : state.currentAccount;
          deleteStores(account);
          return { accounts: newAccounts, currentAccount: newCurrentAccount };
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
              state.currentAccount = "TEMPORARY_ACCOUNT";
              state.accounts = ["TEMPORARY_ACCOUNT"];
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
  user: UserStoreType;
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

export const useUserStore = currentAccountStoreHook("user");
export const getUserStore = (account: string) => getAccountStore(account).user;

export const useChatStore = currentAccountStoreHook("chat");
export const getChatStore = (account: string) => getAccountStore(account).chat;
