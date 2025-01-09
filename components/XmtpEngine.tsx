import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred";
import logger from "@utils/logger";
import { stopStreamingAllMessage } from "@utils/xmtpRN/messages";
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from "react-native";

import {
  getChatStore,
  useAccountsStore,
  getInboxIdsList,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { getTopicsData } from "../utils/api";
import { stopStreamingConversations } from "../utils/xmtpRN/conversations";
import { syncConversationListXmtpClient } from "../utils/xmtpRN/sync";

class XmtpEngine {
  accountsStoreSubscription: (() => void) | null = null;
  appStoreSubscription: (() => void) | null = null;
  appStateSubscription: NativeEventSubscription | null = null;
  isInternetReachable: boolean = false;
  hydrationDone: boolean = false;
  syncedAccounts: { [account: string]: boolean } = {};
  syncingAccounts: { [account: string]: boolean } = {};
  appState: AppStateStatus = AppState.currentState;
  started: boolean = false;

  start() {
    logger.debug("[XmtpEngine] Starting");
    if (this.started) {
      return;
    }

    this.started = true;
    this.syncedAccounts = {};
    this.syncingAccounts = {};

    const { isInternetReachable, hydrationDone } = useAppStore.getState();
    this.isInternetReachable = isInternetReachable;
    this.hydrationDone = hydrationDone;
    this.accountsStoreSubscription = useAccountsStore.subscribe(
      (state, previousState) => {
        if (!previousState?.inboxIds || !state?.inboxIds) return;
        if (previousState.inboxIds !== state.inboxIds) {
          const inboxIds = new Set(previousState.inboxIds);
          const newInboxIds = new Set(state.inboxIds);
          const inboxIdsToSync = [...newInboxIds].filter(
            (inboxId) => !inboxIds.has(inboxId)
          );
          if (inboxIdsToSync.length > 0) {
            this.syncAccounts({ inboxIdsToSync });
          }
        }
      }
    );
    this.appStoreSubscription = useAppStore.subscribe(
      (state, previousState) => {
        this.isInternetReachable = state.isInternetReachable;
        this.hydrationDone = state.hydrationDone;

        if (previousState.isInternetReachable !== state.isInternetReachable) {
          this.onInternetReachabilityChange(state.isInternetReachable);
        }
        if (previousState.hydrationDone !== state.hydrationDone) {
          this.onHydrationDone(state.hydrationDone);
        }
      }
    );

    this.appState = AppState.currentState;
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        const previousAppState = this.appState;
        this.appState = nextAppState;
        logger.debug(
          `[XmtpEngine] App is now ${nextAppState} - was ${previousAppState}`
        );
        if (
          nextAppState === "active" &&
          appStateIsBlurredState(previousAppState)
        ) {
          this.onAppFocus();
        } else if (
          appStateIsBlurredState(nextAppState) &&
          previousAppState === "active"
        ) {
          this.onAppBlur();
        }
      }
    );
  }

  onInternetReachabilityChange(isInternetReachable: boolean) {
    logger.debug(
      `[XmtpEngine]  Internet reachability changed: ${isInternetReachable}`
    );
    this.syncAccounts({ inboxIdsToSync: getInboxIdsList() });
  }

  onHydrationDone(hydrationDone: boolean) {
    logger.debug(`[XmtpEngine] Hydration done changed: ${hydrationDone}`);
    this.syncAccounts({ inboxIdsToSync: getInboxIdsList() });
  }

  onAppFocus() {
    logger.debug("[XmtpEngine] App is now active, reconnecting db connections");
    if (this.hydrationDone) {
      if (this.isInternetReachable) {
        this.syncAccounts({ inboxIdsToSync: getInboxIdsList() });
      }
    }
  }

  async onAppBlur() {
    logger.debug(
      "[XmtpEngine] App is now inactive, stopping xmtp streams and db connections"
    );
    for (const inboxId of getInboxIdsList()) {
      await Promise.all([
        stopStreamingAllMessage({ inboxId }),
        stopStreamingConversations({ inboxId }),
      ]);
    }
  }

  async syncAccounts({ inboxIdsToSync }: { inboxIdsToSync: string[] }) {
    inboxIdsToSync.forEach((inboxId) => {
      if (!this.syncingAccounts[inboxId]) {
        logger.info(`[XmtpEngine] Syncing account ${inboxId}`);
        getTopicsData({ inboxId }).then((topicsData) => {
          getChatStore({ inboxId }).getState().setTopicsData(topicsData, true);
        });
        this.syncedAccounts[inboxId] = true;
        this.syncingAccounts[inboxId] = true;
        syncConversationListXmtpClient({ inboxId })
          .then(() => {
            this.syncingAccounts[inboxId] = false;
          })
          .catch(() => {
            this.syncingAccounts[inboxId] = false;
          });
      }
    });
  }

  destroy() {
    logger.debug("[XmtpEngine] Removing subscriptions");
    this.accountsStoreSubscription?.();
    this.appStoreSubscription?.();
    this.appStateSubscription?.remove();
  }
}

export const xmtpEngine = new XmtpEngine();
