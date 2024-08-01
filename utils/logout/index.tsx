import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { useCallback } from "react";

import { useDisconnectFromPrivy } from "./privy";
import { useDisconnectWallet } from "./wallet";
import { clearConverseDb, getConverseDbPath } from "../../data/db";
import {
  getAccountsList,
  getChatStore,
  getWalletStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { deleteSecureItemAsync } from "../keychain";
import { deleteAccountEncryptionKey, deleteXmtpKey } from "../keychain/helpers";
import mmkv, { clearSecureMmkvForAccount, secureMmkvByAccount } from "../mmkv";
import {
  deleteSubscribedTopics,
  lastNotifSubscribeByAccount,
  unsubscribeFromNotifications,
} from "../notifications";
import { resetSharedData } from "../sharedData";
import { getXmtpApiHeaders } from "../xmtpRN/api";
import { importedTopicsDataForAccount } from "../xmtpRN/conversations";
import { deleteXmtpClient, getXmtpClient } from "../xmtpRN/sync";

type LogoutTasks = {
  [account: string]: {
    topics: string[];
    apiHeaders: { [key: string]: string };
    pkPath: string | undefined;
  };
};

export const getLogoutTasks = (): LogoutTasks => {
  const logoutTasksString = mmkv.getString("converse-logout-tasks");
  if (logoutTasksString) {
    try {
      return JSON.parse(logoutTasksString);
    } catch (e) {
      console.log(e);
      return {};
    }
  } else {
    return {};
  }
};

export const removeLogoutTask = (account: string) => {
  const logoutTasks = getLogoutTasks();
  if (account in logoutTasks) {
    delete logoutTasks[account];
    mmkv.set("converse-logout-tasks", JSON.stringify(logoutTasks));
    console.log(`[Logout] Removed ${account} from logout tasks`);
  }
};

export const saveLogoutTask = (
  account: string,
  apiHeaders: { [key: string]: string },
  topics: string[],
  pkPath: string | undefined
) => {
  const logoutTasks = getLogoutTasks();
  logoutTasks[account] = { topics, apiHeaders, pkPath };
  mmkv.set("converse-logout-tasks", JSON.stringify(logoutTasks));
  console.log(
    `[Logout] Saved ${topics.length} topics to logout for ${account}`
  );
};

export const waitForLogoutTasksDone = async (ms: number) => {
  while (executingLogoutTasks) {
    console.log(`[Logout] Executing logout tasks, waiting for a bit`);
    await new Promise((r) => setTimeout(r, ms));
  }
};

let executingLogoutTasks = false;

const assertNotLogged = (account: string) => {
  const loggedAccounts = getAccountsList();
  if (loggedAccounts.includes(account)) {
    throw new Error("CONVERSE_ACCOUNT_LOGGED_IN");
  }
  return loggedAccounts.includes(account);
};

export const executeLogoutTasks = async () => {
  // Prevent multiple logout tasks to execute at the same time
  await waitForLogoutTasksDone(3000);

  const tasks = getLogoutTasks();
  const hasTasks = Object.keys(tasks).length > 0;

  if (!hasTasks) {
    return false;
  }

  executingLogoutTasks = true;

  for (const account in tasks) {
    try {
      assertNotLogged(account);
      const task = tasks[account];
      console.log(
        `[Logout] Executing logout task for ${account} (${task.topics.length} topics)`
      );
      // await deleteXmtpDatabaseEncryptionKey(account);
      await clearSecureMmkvForAccount(account);
      await deleteXmtpKey(account);
      await deleteAccountEncryptionKey(account);
      if (task.pkPath) {
        await deleteSecureItemAsync(task.pkPath);
      }
      assertNotLogged(account);
      resetSharedData(task.topics || []);
      assertNotLogged(account);
      // This will fail if no connection (5sec timeout)
      await unsubscribeFromNotifications(task.apiHeaders);
      removeLogoutTask(account);
    } catch (e: any) {
      if (e.toString().includes("CONVERSE_ACCOUNT_LOGGED_IN")) {
        removeLogoutTask(account);
      } else {
        console.error(
          `[Logout] Could not finish logging out for ${account}`,
          e
        );
      }
    }
  }
  executingLogoutTasks = false;
  return true;
};

export const useLogoutFromConverse = (account: string) => {
  const privyLogout = useDisconnectFromPrivy();
  const disconnectWallet = useDisconnectWallet();
  const logout = useCallback(
    async (dropLocalDatabase: boolean) => {
      // This clears the libxmtp sqlite database (v3 / groups)
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      await client.dropLocalDatabaseConnection();
      console.log("[Logout] successfully dropped connection to libxmp db");
      if (dropLocalDatabase) {
        await client.deleteLocalDatabase();
        console.log("[Logout] successfully deleted libxmp db");
      }
      disconnectWallet();
      const isPrivyAccount =
        !!useAccountsStore.getState().privyAccountId[account];
      if (isPrivyAccount) {
        privyLogout();
      }
      const topicsByAccount: { [a: string]: string[] } = {};
      const accounts = getAccountsList();
      accounts.forEach((a) => {
        topicsByAccount[a] = Object.keys(
          getChatStore(a).getState().conversations
        );
      });

      // We need to delete topics that are in this account and not other accounts
      // so we start with topics from this account and we'll remove topics we find in others
      const topicsToDelete = topicsByAccount[account];
      const pkPath = getWalletStore(account).getState().privateKeyPath;
      const apiHeaders = await getXmtpApiHeaders(account);
      accounts.forEach((a) => {
        if (a !== account) {
          topicsByAccount[a].forEach((topic) => {
            const topicIndex = topicsToDelete.indexOf(topic);
            if (topicIndex > -1) {
              topicsToDelete.splice(topicIndex, 1);
            }
          });
        }
      });

      // Get converse db path before deleting account
      const converseDbPath = await getConverseDbPath(account);

      // Remove account so we don't use it anymore
      useAccountsStore.getState().removeAccount(account);

      // This clears the Converse sqlite database (v2)
      clearConverseDb(account, converseDbPath);

      deleteXmtpClient(account);
      deleteSubscribedTopics(account);
      delete importedTopicsDataForAccount[account];
      delete secureMmkvByAccount[account];
      delete lastNotifSubscribeByAccount[account];

      saveLogoutTask(account, apiHeaders, topicsToDelete, pkPath);

      setTimeout(() => {
        executeLogoutTasks();
      }, 500);
    },
    [account, disconnectWallet, privyLogout]
  );
  return logout;
};
