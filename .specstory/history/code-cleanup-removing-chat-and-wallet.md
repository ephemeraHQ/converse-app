## SpecStory

## Code Cleanup: Removing Chat and Wallet (2/12/2025, 10:34:17 AM)

_**User**_

remove chat and wallet stuff

---

_**Assistant**_

I'll help remove the chat and wallet related code from the multi-inbox store. Here are the changes:

```typescript:features/multi-inbox/multi-inbox.store.ts
// ... existing code ...

type AccountStoreDataType = {
  settings: SettingsStoreType;
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
    };
  }
};

export const deleteStores = (account: string) => {
  logger.debug(`[multi-inbox store] Deleting account ${account}`);
  delete storesByAccount[account];
  mmkv.delete(`store-${account}-settings`);
};

// ... existing code ...

// Store exports
export const useSettingsStore = currentAccountStoreHook("settings");
export const getSettingsStore = (account: string) =>
  getAccountStore(account).settings;

// ... rest of existing code ...
```

The changes made:

1. Removed `chat` and `wallet` from `AccountStoreDataType`
2. Removed `chat` and `wallet` initialization in `initStores()`
3. Removed `chat` and `wallet` store deletion in `deleteStores()`
4. Removed `useChatStore` and `getWalletStore` exports
5. Kept all other functionality intact

The store now only manages settings-related state, removing the chat and wallet functionality that was causing the type errors.

---



---

