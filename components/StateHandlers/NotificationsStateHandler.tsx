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
import { useSelect } from "../../data/store/storeHelpers";
import { saveUser } from "../../utils/api";
import { sortAndComputePreview } from "../../utils/conversation";
import { executeLogoutTasks } from "../../utils/logout";
import {
  saveNotificationsStatus,
  resetNotifications,
} from "../../utils/notifications";

export default function ConversationsStateHandler() {
  // This handler checks conversations that it needs to show
  // or not show (consent / spam etc) and also computes preview
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
  const { conversations, topicsData, lastUpdateAt } = useChatStoreForAccount(
    account
  )(useSelect(["conversations", "topicsData", "lastUpdateAt"]));
  const peersStatus = useSettingsStoreForAccount(account)((s) => s.peersStatus);
  const lastRefreshState = useRef({
    account,
    conversations: 0,
    topicsData: 0,
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
      topicsData: Object.keys(topicsData).length,
      peersStatus: Object.keys(peersStatus).length,
      lastUpdateAt,
    };
    if (
      newRefreshState.account !== lastRefreshState.current.account ||
      newRefreshState.conversations !==
        lastRefreshState.current.conversations ||
      newRefreshState.topicsData !== lastRefreshState.current.topicsData ||
      newRefreshState.peersStatus !== lastRefreshState.current.peersStatus ||
      newRefreshState.lastUpdateAt !== lastRefreshState.current.lastUpdateAt
    ) {
      lastRefreshState.current = newRefreshState;
      sortAndComputePreview(conversations, account, topicsData, peersStatus);
    }
  }, [
    account,
    conversations,
    hydrationDone,
    peersStatus,
    topicsData,
    lastUpdateAt,
  ]);
  return null;
};
