## SpecStory

## Removing Transaction-Related Code (1/28/2025, 10:28:45 AM)

_**User**_

remove all transacitons related stuff

---

_**Assistant**_

I'll help remove all transactions-related code from the file. Here are the necessary edits:

```typescript:data/store/accountsStore.ts
// ... existing code ...

import {
  GroupStatus,
  initSettingsStore,
  SettingsStoreType,
} from "./settingsStore";
// Remove transactions import
import { initWalletStore, WalletStoreType } from "./walletStore";

type AccountStoreDataType = {
  settings: SettingsStoreType;
  chat: ChatStoreType;
  wallet: WalletStoreType;
  // Remove transactions type
};

// ... existing code ...

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
      // Remove transactions initialization
    };
  }
};

const deleteStores = (account: string) => {
  logger.debug(`[AccountsStore] Deleting account ${account}`);
  delete storesByAccount[account];
  mmkv.delete(`store-${account}-chat`);
  mmkv.delete(`store-${account}-settings`);
  mmkv.delete(`store-${account}-wallet`);
  // Remove transactions deletion
};

// ... existing code ...
```

Changes made:
1. Removed the transactions store import
2. Removed transactions from AccountStoreDataType
3. Removed transactions initialization in initStores
4. Removed transactions deletion in deleteStores

The rest of the file can remain unchanged as it doesn't contain any transactions-specific code.

---



---

