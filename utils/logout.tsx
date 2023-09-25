import { clearDb } from "../data/db";
import {
  getAccountsList,
  getChatStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { buildUserInviteTopic } from "../vendor/xmtp-js/src";
import { deleteConversationsFromKeychain, deleteXmtpKey } from "./keychain";
import {
  deleteSubscribedTopics,
  unsubscribeFromNotifications,
} from "./notifications";
import { resetSharedData } from "./sharedData/sharedData";
import { deleteXmtpClient } from "./xmtpRN/client";

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
  // TODO => we should save this information
  // to be able to do it even offline.
  // need to save : known conversation topics + account
  // to remove the notifications & the keys (main one & conversations ones)
  setTimeout(() => {
    deleteXmtpKey(account);
    if (topicsToDelete.length > 0) {
      deleteConversationsFromKeychain(account, topicsToDelete);
      resetSharedData(topicsToDelete);
    }
    unsubscribeFromNotifications([
      ...topicsToDelete,
      buildUserInviteTopic(account || ""),
    ]);
  }, 500);
};
