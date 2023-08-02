import { create, StoreApi, UseBoundStore } from "zustand";

import { ProfilesStoreType, initProfilesStore } from "./profilesStore";

type AccountsStoreStype = {
  currentAccount: string;
};

// This store is global (i.e. not linked to an account)
// For now we only use a single account so we initialize it
// and don't add a setter.

export const useAccountsStore = create<AccountsStoreStype>()((set) => ({
  currentAccount: "MAIN_ACCOUNT",
}));

// Each account gets multiple substores! Here we define the substore types and
// getters / setters / helpers to manage these multiple stores for each account

// Add here the type of each store data
type AccountStoreDataType = {
  profiles: ProfilesStoreType;
};

// And here call the init method of each store
const initStoreForAccount = (account: string) => {
  const profilesStore = initProfilesStore();
  storesByAccount[account] = { profiles: profilesStore };
};

type AccountStoreType = {
  [K in keyof AccountStoreDataType]: UseBoundStore<
    StoreApi<AccountStoreDataType[K]>
  >;
};

const storesByAccount: {
  [account: string]: AccountStoreType;
} = {};

const getAccountStore = (account: string) => {
  if (account in storesByAccount) {
    return storesByAccount[account];
  } else {
    throw new Error(`Tried to access non existent store for ${account}`);
  }
};

// Right now we just handle a single account, MAIN_ACCOUNT, so we init it ASAP

initStoreForAccount("MAIN_ACCOUNT");

// This enables us to use account-based substores for the current selected user automatically,
// Just call export useSubStore = accountStoreHook("subStoreName") in the substore definition

export const currentAccountStoreHook = (key: keyof AccountStoreDataType) => {
  const _useStore = <U>(
    selector: (state: AccountStoreDataType[typeof key]) => U
  ) => {
    const currentAccount = useAccountsStore((s) => s.currentAccount);
    const accountStore = getAccountStore(currentAccount);
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[typeof key];
  use.getState = () => {
    const currentAccountState = useAccountsStore.getState();
    const currentAccount = currentAccountState.currentAccount;
    const accountStore = getAccountStore(currentAccount);
    return accountStore[key].getState();
  };
  return use;
};

// This enables us to use account-based substores for the any user automatically,
// Just call export useSubStore = accountStoreHook("account", "subStoreName") in the substore definition

export const accountStoreHook = (
  account: string,
  key: keyof AccountStoreDataType
) => {
  const _useStore = <U>(
    selector: (state: AccountStoreDataType[typeof key]) => U
  ) => {
    const accountStore = getAccountStore(account);
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[typeof key];
  use.getState = () => {
    const accountStore = getAccountStore(account);
    return accountStore[key].getState();
  };
  return use;
};
