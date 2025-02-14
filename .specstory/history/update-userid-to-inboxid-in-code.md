## SpecStory

## Update userId to inboxId in code (2/12/2025, 2:50:50 PM)

_**User**_

ok userId: string isn't good we want inboxId: string

---

_**Assistant**_

I'll help update the code to use `inboxId` instead of `userId`. Here are the necessary changes:

```typescript:features/multi-inbox/multi-inbox.store.ts
// ... existing code ...

const storesByAccount: {
  [inboxId: string]: AccountStoreType;
} = {};

// Store initialization
export const initStores = (inboxId: string) => {
  if (!(inboxId in storesByAccount)) {
    logger.debug(`[multi-inbox store] Initiating inbox ${inboxId}`);
    // If adding a persisted store here, please add
    // the deletion method in deleteStores
    storesByAccount[inboxId] = {
      settings: initSettingsStore(inboxId),
    };
  }
};

export const deleteStores = (inboxId: string) => {
  logger.debug(`[multi-inbox store] Deleting inbox ${inboxId}`);
  delete storesByAccount[inboxId];
  mmkv.delete(`store-${inboxId}-settings`);
};

// ... existing code ...

const getAccountStore = (inboxId: string) => {
  if (!inboxId) {
    throw new Error("No inboxId provided");
  }

  if (inboxId in storesByAccount) {
    return storesByAccount[inboxId];
  }
  throw new Error(`No account store found for ${inboxId}`);
};

// ... existing code ...

const currentAccountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const currentSender = useAccountsStore((s) => s.currentSender);
    const currentInboxId = currentSender?.inboxId;
    if (!currentInboxId) {
      return {
        getState: () => {
          return {
            [key]: {} as AccountStoreDataType[T],
          };
        },
      };
    }
    const accountStore = getAccountStore(currentInboxId);
    if (!accountStore) {
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
    const currentInboxId = currentAccountState.currentSender?.inboxId;
    if (!currentInboxId) {
      throw new Error("No current sender");
    }
    const accountStore = getAccountStore(currentInboxId);
    return accountStore[key].getState();
  };

  return use;
};

// Store exports
export const useSettingsStore = currentAccountStoreHook("settings");
export const getSettingsStore = (inboxId: string) =>
  getAccountStore(inboxId).settings;
```

I've made the following changes:
1. Renamed the index signature in `storesByAccount` from `userId` to `inboxId`
2. Updated all function parameters from `userId` to `inboxId`
3. Updated error messages and logging to reference "inbox" instead of "user"
4. In the `currentAccountStoreHook`, changed to use `currentSender?.inboxId` instead of `ethereumAddress`

These changes make the store consistent with using `inboxId` as the primary identifier for accounts rather than `userId`. The store will now be indexed by `inboxId` which is more accurate for the multi-inbox functionality.

---



---

