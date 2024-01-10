import { clearDb } from "../data/db";
import {
  getAccountsList,
  getChatStore,
  getWalletStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { deleteSecureItemAsync } from "./keychain";
import { deleteXmtpKey } from "./keychain/helpers";
import mmkv from "./mmkv";
import {
  deleteSubscribedTopics,
  unsubscribeFromNotifications,
} from "./notifications";
import { resetSharedData } from "./sharedData";
import { getXmtpApiHeaders } from "./xmtpRN/api";
import { deleteXmtpClient } from "./xmtpRN/sync";

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
      await deleteXmtpKey(account);
      if (task.pkPath) {
        await deleteSecureItemAsync(task.pkPath);
      }
      assertNotLogged(account);
      if (task.topics.length > 0) {
        // This is too long and might race with re-login, let's not do it for now
        // it could be done by having a different account id even if you re-login with
        // same account.
        // await deleteConversationsFromKeychain(account, task.topics);
        resetSharedData(task.topics);
      }
      assertNotLogged(account);
      // This will fail if no connection and will be tried later async
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

export const logout = async (account: string) => {
  const topicsByAccount: { [a: string]: string[] } = {};
  const accounts = getAccountsList();
  accounts.forEach((a) => {
    topicsByAccount[a] = Object.keys(getChatStore(a).getState().conversations);
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

  clearDb(account);

  // Now that db has been deleted we can remove account
  // from store (account holds the db id so it was needed
  // to clear db)
  useAccountsStore.getState().removeAccount(account);

  deleteXmtpClient(account);
  deleteSubscribedTopics(account);

  saveLogoutTask(account, apiHeaders, topicsToDelete, pkPath);

  setTimeout(() => {
    executeLogoutTasks();
  }, 500);
};
