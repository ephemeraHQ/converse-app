import {
  dropConverseDbConnections,
  reconnectConverseDbConnections,
} from "@data/db/driver";
import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred";
import logger from "@utils/logger";
import { stopStreamingAllMessage } from "@utils/xmtpRN/messages";
import { useCallback, useEffect, useRef } from "react";
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  Platform,
} from "react-native";

import { getExistingDataSource } from "../data/db/datasource";
import { getAccountsList, getChatStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { getTopicsData } from "../utils/api";
import { loadSavedNotificationMessagesToContext } from "../utils/notifications";
import {
  createPendingConversations,
  stopStreamingConversations,
  stopStreamingGroups,
} from "../utils/xmtpRN/conversations";
import { sendPendingMessages } from "../utils/xmtpRN/send";
import { syncXmtpClient } from "../utils/xmtpRN/sync";

class XmtpEngine {
  appStoreSubscription: () => void;
  appStateSubscription: NativeEventSubscription;
  isInternetReachable: boolean;
  hydrationDone: boolean;
  syncedAccounts: { [account: string]: boolean };
  syncingAccounts: { [account: string]: boolean };
  appState: AppStateStatus;

  constructor() {
    logger.debug("[XmtpEngine] Initializing");
    this.syncedAccounts = {};
    this.syncingAccounts = {};

    const { isInternetReachable, hydrationDone } = useAppStore.getState();
    this.isInternetReachable = isInternetReachable;
    this.hydrationDone = hydrationDone;
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
    // Normal app usage won't call this, but hot reloading will
    logger.debug("[XmtpEngine] Removing subscriptions");
    this.appStoreSubscription();
    this.appStateSubscription.remove();
  }
}

export const xmtpEngine = new XmtpEngine();

export function XmtpCron() {
  // Cron
  const lastCronTimestamp = useRef(0);
  const runningCron = useRef(false);

  const xmtpCron = useCallback(async () => {
    if (
      !useAppStore.getState().splashScreenHidden ||
      AppState.currentState.match(/inactive|background/)
    ) {
      return;
    }
    runningCron.current = true;
    const accounts = getAccountsList();
    for (const account of accounts) {
      if (
        getChatStore(account).getState().localClientConnected &&
        (Platform.OS === "web" || getExistingDataSource(account))
      ) {
        try {
          await createPendingConversations(account);
          await sendPendingMessages(account);
        } catch (e) {
          logger.error(e);
        }
      }
    }
    lastCronTimestamp.current = new Date().getTime();
    runningCron.current = false;
  }, []);

  useEffect(() => {
    // Launch cron
    const interval = setInterval(() => {
      if (runningCron.current) return;
      const now = new Date().getTime();
      if (now - lastCronTimestamp.current > 1000) {
        xmtpCron();
      }
    }, 300);

    return () => clearInterval(interval);
  }, [xmtpCron]);

  return null;
}
