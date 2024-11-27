import {
  dropConverseDbConnections,
  reconnectConverseDbConnections,
} from "@data/db/driver";
import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred";
import logger from "@utils/logger";
import { stopStreamingAllMessage } from "@utils/xmtpRN/messages";
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from "react-native";

import { getExistingDataSource } from "../data/db/datasource";
import {
  getAccountsList,
  getChatStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { getTopicsData } from "../utils/api";
import { loadSavedNotificationMessagesToContext } from "../features/notifications/utils/loadSavedNotificationMessagesToContext";
import {
  createPendingConversations,
  stopStreamingConversations,
  stopStreamingGroups,
} from "../utils/xmtpRN/conversations";
import { sendPendingMessages } from "../utils/xmtpRN/send";
import { syncXmtpClient } from "../utils/xmtpRN/sync";

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
        if (!previousState?.accounts || !state?.accounts) return;
        if (previousState.accounts !== state.accounts) {
          const previousAccounts = new Set(previousState.accounts);
          const newAccounts = new Set(state.accounts);
          const accountsToSync = [...newAccounts].filter(
            (account) => !previousAccounts.has(account)
          );
          if (accountsToSync.length > 0) {
            this.syncAccounts(accountsToSync);
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
    this.syncAccounts(getAccountsList());
  }

  onHydrationDone(hydrationDone: boolean) {
    logger.debug(`[XmtpEngine] Hydration done changed: ${hydrationDone}`);
    this.syncAccounts(getAccountsList());
  }

  onAppFocus() {
    logger.debug("[XmtpEngine] App is now active, reconnecting db connections");
    reconnectConverseDbConnections();
    if (this.hydrationDone) {
      loadSavedNotificationMessagesToContext();
      if (this.isInternetReachable) {
        this.syncAccounts(getAccountsList());
      }
    }
  }

  async onAppBlur() {
    logger.debug(
      "[XmtpEngine] App is now inactive, stopping xmtp streams and db connections"
    );
    for (const account of getAccountsList()) {
      await Promise.all([
        stopStreamingAllMessage(account),
        stopStreamingConversations(account),
        stopStreamingGroups(account),
      ]);
    }
    dropConverseDbConnections();
  }

  async syncAccounts(accountsToSync: string[]) {
    accountsToSync.forEach((a) => {
      if (!this.syncingAccounts[a]) {
        logger.info(`[XmtpEngine] Syncing account ${a}`);
        getTopicsData(a).then((topicsData) => {
          getChatStore(a).getState().setTopicsData(topicsData, true);
        });
        this.syncedAccounts[a] = true;
        this.syncingAccounts[a] = true;
        syncXmtpClient(a)
          .then(() => {
            this.syncingAccounts[a] = false;
          })
          .catch(() => {
            this.syncingAccounts[a] = false;
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

class XmtpCron {
  private lastCronTimestamp: number = 0;
  private runningCron: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  private async xmtpCron() {
    if (
      !useAppStore.getState().splashScreenHidden ||
      AppState.currentState.match(/inactive|background/)
    ) {
      return;
    }
    this.runningCron = true;
    const accounts = getAccountsList();
    for (const account of accounts) {
      if (
        getChatStore(account).getState().localClientConnected &&
        getExistingDataSource(account)
      ) {
        try {
          await createPendingConversations(account);
          await sendPendingMessages(account);
        } catch (e) {
          logger.error(e);
        }
      }
    }
    this.lastCronTimestamp = new Date().getTime();
    this.runningCron = false;
  }

  start() {
    logger.debug("[XmtpCron] Starting");
    this.interval = setInterval(() => {
      if (this.runningCron) return;
      const now = new Date().getTime();
      if (now - this.lastCronTimestamp > 1000) {
        this.xmtpCron();
      }
    }, 300);
  }

  destroy() {
    logger.debug("[XmtpCron] Destroying");
    this.interval && clearInterval(this.interval);
  }
}

export const xmtpCron = new XmtpCron();
