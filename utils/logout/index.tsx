import { deleteLibXmtpDatabaseForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { dropXmtpClient } from "@utils/xmtpRN/client";
import { ConverseXmtpClientType } from "@utils/xmtpRN/client.types";
import { getInboxId } from "@utils/xmtpRN/signIn";
import { useCallback } from "react";

import { useDisconnectFromPrivy } from "./privy";
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
    apiHeaders: { [key: string]: string } | undefined;
    pkPath: string | undefined;
  };
};

export const getLogoutTasks = (): LogoutTasks => {
  const logoutTasksString = mmkv.getString("converse-logout-tasks");
  if (logoutTasksString) {
    try {
      return JSON.parse(logoutTasksString);
    } catch (e) {
      logger.warn(e);
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
    logger.debug(`[Logout] Removed ${account} from logout tasks`);
  }
};

export const saveLogoutTask = (
  account: string,
  apiHeaders: { [key: string]: string } | undefined,
  topics: string[],
  pkPath: string | undefined
) => {
  const logoutTasks = getLogoutTasks();
  logoutTasks[account] = { topics, apiHeaders, pkPath };
  mmkv.set("converse-logout-tasks", JSON.stringify(logoutTasks));
  logger.debug(
    `[Logout] Saved ${topics.length} topics to logout for ${account}`
  );
};

export const waitForLogoutTasksDone = async (ms: number) => {
  while (executingLogoutTasks) {
    logger.debug(`[Logout] Executing logout tasks, waiting for a bit`);
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
      logger.debug(
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
      if (task.apiHeaders) {
        unsubscribeFromNotifications(task.apiHeaders);
      }
      removeLogoutTask(account);
    } catch (e: any) {
      if (e.toString().includes("CONVERSE_ACCOUNT_LOGGED_IN")) {
        removeLogoutTask(account);
      } else {
        logger.error(e, {
          context: `[Logout] Could not finish logging out for ${account}`,
        });
      }
    }
  }
  executingLogoutTasks = false;
  return true;
};

export const logoutAccount = async (
  account: string,
  dropLocalDatabase: boolean,
  isV3Enabled: boolean = true,
  privyLogout: () => void
) => {
  logger.debug(
    `[Logout] Logging out from ${account} with dropLocalDatabase=${dropLocalDatabase} and isV3Enabled=${isV3Enabled}`
  );
  if (isV3Enabled) {
    // This clears the libxmtp sqlite database (v3 / groups)
    try {
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      await client.dropLocalDatabaseConnection();
      logger.debug("[Logout] successfully dropped connection to libxmp db");
      if (dropLocalDatabase) {
        await client.deleteLocalDatabase();
        logger.debug("[Logout] successfully deleted libxmp db");
        // Manual delete database files
        await deleteLibXmtpDatabaseForInboxId(client.inboxId);
      }
    } catch (error) {
      logger.warn("Could not get XMTP Client while logging out", {
        error,
      });
    }
  }
  await dropXmtpClient(await getInboxId(account));
  const isPrivyAccount = !!useAccountsStore.getState().privyAccountId[account];
  if (isPrivyAccount) {
    privyLogout();
  }
  const topicsByAccount: { [a: string]: string[] } = {};
  const accounts = getAccountsList();
  accounts.forEach((a) => {
    topicsByAccount[a] = Object.keys(getChatStore(a).getState().conversations);
  });

  // We need to delete topics that are in this account and not other accounts
  // so we start with topics from this account and we'll remove topics we find in others
  const topicsToDelete = topicsByAccount[account] || [];
  const pkPath = getWalletStore(account).getState().privateKeyPath;

  let apiHeaders: { [key: string]: string } | undefined;

  try {
    apiHeaders = await getXmtpApiHeaders(account);
  } catch (error) {
    // If we have a broken client we might not be able
    // to generate the headers
    logger.warn("Could not get API headers while logging out", {
      error,
    });
  }

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
};

export const useLogoutFromConverse = (account: string) => {
  const privyLogout = useDisconnectFromPrivy();
  const logout = useCallback(
    async (dropLocalDatabase: boolean, isV3Enabled: boolean = true) => {
      logoutAccount(account, dropLocalDatabase, isV3Enabled, privyLogout);
    },
    [account, privyLogout]
  );
  return logout;
};
