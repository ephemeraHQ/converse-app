import { deleteLibXmtpDatabaseForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { dropXmtpClient } from "@utils/xmtpRN/client";
import { ConverseXmtpClientType } from "@utils/xmtpRN/client.types";
import { getInboxId } from "@utils/xmtpRN/signIn";
import { useCallback } from "react";

import {
  getAccountsList,
  getWalletStore,
  TEMPORARY_ACCOUNT_NAME,
  useAccountsStore,
} from "@data/store/accountsStore";
import { setAuthStatus } from "@data/store/authStore";
import { deleteSecureItemAsync } from "@utils/keychain";
import {
  deleteAccountEncryptionKey,
  deleteXmtpKey,
} from "@utils/keychain/helpers";
import mmkv, {
  clearSecureMmkvForAccount,
  secureMmkvByAccount,
} from "@utils/mmkv";

import { useDisconnectFromPrivy } from "./privy";
import { deleteXmtpClient, getXmtpClient } from "../xmtpRN/sync";
import { unsubscribeFromNotifications } from "@features/notifications/utils/unsubscribeFromNotifications";
import { deleteSubscribedTopics } from "@features/notifications/utils/deleteSubscribedTopics";
import { lastNotifSubscribeByAccount } from "@features/notifications/utils/lastNotifSubscribeByAccount";
import { InstallationId } from "@xmtp/react-native-sdk/build/lib/Client";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import { resetNotifications } from "@/features/notifications/utils/resetNotifications";

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
      return JSON.parse(logoutTasksString) as LogoutTasks;
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
      resetNotifications(account);
      // await deleteXmtpDatabaseEncryptionKey(account);
      await deleteXmtpKey(account);
      await deleteAccountEncryptionKey(account);
      if (task.pkPath) {
        await deleteSecureItemAsync(task.pkPath);
      }

      assertNotLogged(account);
      if (task.apiHeaders) {
        // This seems wrong, if the request fails then the user is still subscribed to pushes
        // We should probably check if the request failed and then retry
        // Pick this up with account refactoring
        unsubscribeFromNotifications(task.apiHeaders);
        await clearSecureMmkvForAccount(account);
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
    `[Logout] Starting logout process for ${account} with dropLocalDatabase=${dropLocalDatabase} and isV3Enabled=${isV3Enabled}`
  );

  // Get initial state for debugging
  const initialCurrentAccount = useAccountsStore.getState().currentAccount;
  logger.debug(`[Logout] Initial current account: ${initialCurrentAccount}`);

  if (isV3Enabled) {
    // This clears the libxmtp sqlite database (v3 / groups)
    try {
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      await client.dropLocalDatabaseConnection();
      logger.debug("[Logout] Successfully dropped connection to libxmp db");
      if (dropLocalDatabase) {
        await client.deleteLocalDatabase();
        logger.debug("[Logout] Successfully deleted libxmp db");
        // Manual delete database files
        await deleteLibXmtpDatabaseForInboxId(client.inboxId);
      }
    } catch (error) {
      logger.warn("[Logout] Could not get XMTP Client while logging out", {
        error,
      });
    }
  }

  await dropXmtpClient((await getInboxId(account)) as InstallationId);
  const isPrivyAccount = !!useAccountsStore.getState().privyAccountId[account];

  // Clean up all account-related data first
  deleteXmtpClient(account);
  deleteSubscribedTopics(account);
  delete secureMmkvByAccount[account];
  delete lastNotifSubscribeByAccount[account];

  // Remove account from store
  logger.debug(`[Logout] Removing account ${account} from store`);
  useAccountsStore.getState().removeAccount(account);

  // Get the updated list of accounts after removal
  const remainingAccounts = getAccountsList();
  logger.debug(
    `[Logout] Remaining accounts after removal: ${JSON.stringify(
      remainingAccounts
    )}`
  );

  // Important: Set auth status to signedOut BEFORE changing current account
  // This ensures navigation state is reset before any account changes
  if (dropLocalDatabase) {
    logger.debug(
      "[Logout] Setting auth status to signedOut due to dropLocalDatabase"
    );
    setAuthStatus("signedOut");
  }

  // Set temporary account
  const setCurrentAccount = useAccountsStore.getState().setCurrentAccount;
  setCurrentAccount(TEMPORARY_ACCOUNT_NAME, false);
  logger.debug(`[Logout] Set temporary account: ${TEMPORARY_ACCOUNT_NAME}`);

  // Execute Privy logout last to prevent any race conditions
  if (isPrivyAccount) {
    logger.debug("[Logout] Executing Privy logout for account");
    privyLogout();
  }

  // Save logout task
  const pkPath = getWalletStore(account).getState().privateKeyPath;
  let apiHeaders: { [key: string]: string } | undefined;
  try {
    apiHeaders = await getXmtpApiHeaders(account);
  } catch (error) {
    logger.warn("[Logout] Could not get API headers while logging out", {
      error,
    });
  }
  saveLogoutTask(account, apiHeaders, [], pkPath);

  // Add a final state check
  setTimeout(() => {
    const finalState = {
      currentAccount: useAccountsStore.getState().currentAccount,
      remainingAccounts: getAccountsList(),
    };
    logger.debug(
      `[Logout] Final state after logout: ${JSON.stringify(finalState)}`
    );
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
