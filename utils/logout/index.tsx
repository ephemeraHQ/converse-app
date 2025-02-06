import { getInboxId } from "@/utils/xmtpRN/signIn";
import {
  deleteXmtpClient,
  dropXmtpClient,
  getXmtpClient,
} from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { StackActions } from "@react-navigation/native";
import { deleteLibXmtpDatabaseForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { converseNavigatorRef } from "@utils/navigation";

import {
  getAccountsList,
  getWalletStore,
  TEMPORARY_ACCOUNT_NAME,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
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

import { resetNotifications } from "@/features/notifications/utils/resetNotifications";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import { deleteSubscribedTopics } from "@features/notifications/utils/deleteSubscribedTopics";
import { lastNotifSubscribeByAccount } from "@features/notifications/utils/lastNotifSubscribeByAccount";
import { unsubscribeFromNotifications } from "@features/notifications/utils/unsubscribeFromNotifications";
import { InstallationId } from "@xmtp/react-native-sdk/build/lib/Client";

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
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes("CONVERSE_ACCOUNT_LOGGED_IN")
      ) {
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

export async function logoutAccount({ account }: { account: string }) {
  // Reset navigation state before cleanup
  converseNavigatorRef.current?.dispatch(StackActions.popToTop());

  try {
    // Clean up XMTP client and database
    const client = await getXmtpClient({
      address: account,
    });
    await client.dropLocalDatabaseConnection();
    logger.debug("[Logout] Successfully dropped connection to libxmp db");

    await client.deleteLocalDatabase();
    logger.debug("[Logout] Successfully deleted libxmp db");
    await deleteLibXmtpDatabaseForInboxId(client.inboxId);
  } catch (error) {
    logger.warn("[Logout] Could not get XMTP Client while logging out", {
      error,
    });
  }

  // Drop XMTP client and clean up account data
  await dropXmtpClient((await getInboxId(account)) as InstallationId);

  // Clean up all account-related data
  deleteXmtpClient({ address: account });
  deleteSubscribedTopics(account);
  delete secureMmkvByAccount[account];
  delete lastNotifSubscribeByAccount[account];

  // Handle account switching and store cleanup
  useAccountsStore.getState().removeAccount(account);
  const remainingAccounts = getAccountsList();
  const setCurrentAccount = useAccountsStore.getState().setCurrentAccount;

  if (remainingAccounts.length > 0) {
    setCurrentAccount(remainingAccounts[0], false);
  } else {
    setCurrentAccount(TEMPORARY_ACCOUNT_NAME, false);
    setAuthStatus("signedOut");
  }

  // Save logout task for background cleanup
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

  setTimeout(() => {
    executeLogoutTasks();
  }, 500);
}
