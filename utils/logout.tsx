import { clearDb } from "../data/db";
import {
  getAccountsList,
  getChatStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { buildUserInviteTopic } from "../vendor/xmtp-js/src";
import { deleteConversationsFromKeychain, deleteXmtpKey } from "./keychain";
import mmkv from "./mmkv";
import {
  deleteSubscribedTopics,
  unsubscribeFromNotifications,
} from "./notifications";
import { resetSharedData } from "./sharedData/sharedData";
import { deleteXmtpClient } from "./xmtpRN/client";

type LogoutTasks = {
  [account: string]: { topics: string[] };
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

export const emptyLogoutTasks = () => {
  mmkv.delete("converse-logout-tasks");
};

export const saveLogoutTask = (account: string, topics: string[]) => {
  const logoutTasks = getLogoutTasks();
  logoutTasks[account] = { topics };
  mmkv.set("converse-logout-tasks", JSON.stringify(logoutTasks));
};

export const executeLogoutTasks = async () => {
  const tasks = getLogoutTasks();
  const hasTasks = Object.keys(tasks).length > 0;
  if (!hasTasks) return false;
  for (const account in tasks) {
    const task = tasks[account];
    await deleteXmtpKey(account);
    if (task.topics.length > 0) {
      await deleteConversationsFromKeychain(account, task.topics);
      resetSharedData(task.topics);
    }
    // This will fail if no connection and will be tried later async
    await unsubscribeFromNotifications([
      ...task.topics,
      buildUserInviteTopic(account || ""),
    ]);
  }
  emptyLogoutTasks();
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

  saveLogoutTask(account, topicsToDelete);

  setTimeout(() => {
    executeLogoutTasks();
  }, 500);
};
