## SpecStory

## Refactoring Class to Functional Approach in TypeScript (1/28/2025, 10:56:11 AM)

_**User**_

remove the Class. Keep the logic but i don't want to use Class so export functions instead

---

_**Assistant**_

I'll help you convert the XmtpEngine class to a functional approach. Here's how we can restructure it:

```typescript:components/XmtpEngine.tsx
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred";
import logger from "@utils/logger";
import { AppState, AppStateStatus, NativeEventSubscription } from "react-native";
import { getAccountsList, useAccountsStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { syncConversationListXmtpClient } from "../utils/xmtpRN/sync";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";

// State management
let accountsStoreSubscription: (() => void) | null = null;
let appStoreSubscription: (() => void) | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
let isInternetReachable = false;
let hydrationDone = false;
let syncedAccounts: { [account: string]: boolean } = {};
let syncingAccounts: { [account: string]: boolean } = {};
let currentAppState: AppStateStatus = AppState.currentState;
let started = false;

// Helper functions
async function syncAccounts(accountsToSync: string[]) {
  accountsToSync.forEach((a) => {
    if (!syncingAccounts[a]) {
      logger.info(`[XmtpEngine] Syncing account ${a}`);
      syncedAccounts[a] = true;
      syncingAccounts[a] = true;
      syncConversationListXmtpClient(a)
        .then(() => {
          syncingAccounts[a] = false;
        })
        .catch(() => {
          syncingAccounts[a] = false;
        });
    }
  });
}

function onInternetReachabilityChange(newIsInternetReachable: boolean) {
  logger.debug(
    `[XmtpEngine] Internet reachability changed: ${newIsInternetReachable}`
  );
  syncAccounts(getAccountsList());
}

function onHydrationDone(newHydrationDone: boolean) {
  logger.debug(`[XmtpEngine] Hydration done changed: ${newHydrationDone}`);
  syncAccounts(getAccountsList());
}

function onAppFocus() {
  logger.debug("[XmtpEngine] App is now active, reconnecting db connections");
  if (hydrationDone && isInternetReachable) {
    syncAccounts(getAccountsList());
  }
}

async function onAppBlur() {
  logger.debug(
    "[XmtpEngine] App is now inactive, stopping xmtp streams and db connections"
  );
  for (const account of getAccountsList()) {
    await Promise.all([
      stopStreamingAllMessage(account),
      stopStreamingConversations(account),
      stopStreamingConsent(account),
    ]);
  }
}

// Main functions
export function startXmtpEngine() {
  logger.debug("[XmtpEngine] Starting");
  if (started) {
    return;
  }

  started = true;
  syncedAccounts = {};
  syncingAccounts = {};

  const appState = useAppStore.getState();
  isInternetReachable = appState.isInternetReachable;
  hydrationDone = appState.hydrationDone;

  accountsStoreSubscription = useAccountsStore.subscribe(
    (state, previousState) => {
      if (!previousState?.accounts || !state?.accounts) return;
      if (previousState.accounts !== state.accounts) {
        const previousAccounts = new Set(previousState.accounts);
        const newAccounts = new Set(state.accounts);
        const accountsToSync = [...newAccounts].filter(
          (account) => !previousAccounts.has(account)
        );
        if (accountsToSync.length > 0) {
          syncAccounts(accountsToSync);
        }
      }
    }
  );

  appStoreSubscription = useAppStore.subscribe((state, previousState) => {
    isInternetReachable = state.isInternetReachable;
    hydrationDone = state.hydrationDone;

    if (previousState.isInternetReachable !== state.isInternetReachable) {
      onInternetReachabilityChange(state.isInternetReachable);
    }
    if (previousState.hydrationDone !== state.hydrationDone) {
      onHydrationDone(state.hydrationDone);
    }
  });

  currentAppState = AppState.currentState;
  appStateSubscription = AppState.addEventListener(
    "change",
    (nextAppState: AppStateStatus) => {
      const previousAppState = currentAppState;
      currentAppState = nextAppState;
      logger.debug(
        `[XmtpEngine] App is now ${nextAppState} - was ${previousAppState}`
      );
      if (nextAppState === "active" && appStateIsBlurredState(previousAppState)) {
        onAppFocus();
      } else if (
        appStateIsBlurredState(nextAppState) &&
        previousAppState === "active"
      ) {
        onAppBlur();
      }
    }
  );
}

export function destroyXmtpEngine() {
  logger.debug("[XmtpEngine] Removing subscriptions");
  accountsStoreSubscription?.();
  appStoreSubscription?.();
  appStateSubscription?.remove();
}
```

Key changes made:
1. Converted the class to a module with exported functions
2. Moved class properties to module-level variables
3. Converted class methods to regular functions
4. Renamed the main functions to `startXmtpEngine` and `destroyXmtpEngine`
5. Kept the internal helper functions as regular functions
6. Maintained the same logic flow but in a functional style

The functionality remains the same, but now it's using a more functional approach without the class syntax. The state is managed through module-level variables, and the functions are exported individually.

---



---

