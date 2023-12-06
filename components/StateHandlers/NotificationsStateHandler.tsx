import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  useAccountsList,
  useAccountsStore,
  useCurrentAccount,
  useChatStoreForAccount,
  useSettingsStoreForAccount,
} from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { saveUser } from "../../utils/api";
import { sortAndComputePreview } from "../../utils/conversation";
import { executeLogoutTasks } from "../../utils/logout";
import {
  onInteractWithNotification,
  saveNotificationsStatus,
  resetNotifications,
  shouldShowNotificationForeground,
} from "../../utils/notifications";
import { pick } from "../../utils/objects";

// This handler determines how the app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: shouldShowNotificationForeground,
});

// This handler determines how the app handles
// notifications that have been clicked on
Notifications.addNotificationResponseReceivedListener(
  onInteractWithNotification
);

export default function NotificationsStateHandler() {
  const appState = useRef(AppState.currentState);
  const userAddress = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);

  useEffect(() => {
    // Things to do when app opens
    saveNotificationsStatus();
    // Dismiss notifications and set badge to 0
    resetNotifications(500);
    executeLogoutTasks();
  }, []);

  useEffect(() => {
    // Things to do when app status changes (does NOT include first load)
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          executeLogoutTasks();
          saveNotificationsStatus();
          // Dismiss notifications and set badge to 0
          resetNotifications(500);
          // Save the user
          if (userAddress) {
            saveUser(userAddress, privyAccountId[userAddress]);
          }
        } else {
          // Things to do when app status changes to inactive
          resetNotifications();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [userAddress, privyAccountId]);

  const accounts = useAccountsList();

  return (
    <>
      {accounts.map((a) => (
        <AccountNotificationsStateHandler
          account={a}
          key={`account-notifications-handler-${a}`}
        />
      ))}
    </>
  );
}

const AccountNotificationsStateHandler = ({ account }: { account: string }) => {
  const hydrationDone = useAppStore((s) => s.hydrationDone);
  const { conversations, topicsStatus, lastUpdateAt } = useChatStoreForAccount(
    account
  )((s) => pick(s, ["conversations", "topicsStatus", "lastUpdateAt"]));
  const { peersStatus } = useSettingsStoreForAccount(account)((s) =>
    pick(s, ["peersStatus"])
  );
  const lastRefreshState = useRef({
    account,
    conversations: 0,
    topicsStatus: 0,
    peersStatus: 0,
    lastUpdateAt: 0,
  });
  // Sync accounts on load and when a new one is added
  useEffect(() => {
    if (!hydrationDone) return;
    // Let's sortAndComputePreview to subscribe to the right notifications
    const newRefreshState = {
      account,
      conversations: Object.keys(conversations).length,
      topicsStatus: Object.keys(topicsStatus).length,
      peersStatus: Object.keys(peersStatus).length,
      lastUpdateAt,
    };
    if (
      newRefreshState.account !== lastRefreshState.current.account ||
      newRefreshState.conversations !==
        lastRefreshState.current.conversations ||
      newRefreshState.topicsStatus !== lastRefreshState.current.topicsStatus ||
      newRefreshState.peersStatus !== lastRefreshState.current.peersStatus ||
      newRefreshState.lastUpdateAt !== lastRefreshState.current.lastUpdateAt
    ) {
      lastRefreshState.current = newRefreshState;
      sortAndComputePreview(conversations, account, topicsStatus, peersStatus);
    }
  }, [
    account,
    conversations,
    hydrationDone,
    peersStatus,
    topicsStatus,
    lastUpdateAt,
  ]);
  return null;
};
