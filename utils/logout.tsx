import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { clearDb } from "../data/db";
import {
  getAccountsList,
  getChatStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { deleteConversationsFromKeychain, deleteXmtpKey } from "./keychain";
import {
  deleteSubscribedTopicsInformation,
  disablePushNotifications,
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
  deleteSubscribedTopicsInformation(account);
  // TODO => we should save this information
  // to be able to do it even offline.
  // need to save : known conversation topics + account
  // to remove the notifications & the keys (main one & conversations ones)
  setTimeout(() => {
    const promisesToAwait: any[] = [];
    promisesToAwait.push(
      deleteConversationsFromKeychain(account, topicsToDelete)
    );
    // Unsubscribing from notifications
    // TODO => remove notifications for this account's topic
    promisesToAwait.push(disablePushNotifications());
    // Delete keychain xmtp
    // TODO => remove keychain XMTP for this account's only
    promisesToAwait.push(deleteXmtpKey(account));
    // Delete shared data
    promisesToAwait.push(resetSharedData());
    // TODO => clear only for this account, are we still using Async storage?
    promisesToAwait.push(clearAsyncStorage());
  }, 500);
};

const clearAsyncStorage = async () => {
  const asyncStorageKeys = await AsyncStorage.getAllKeys();
  if (asyncStorageKeys.length > 0) {
    if (Platform.OS === "android") {
      await AsyncStorage.clear();
    }
    if (Platform.OS === "ios") {
      await AsyncStorage.multiRemove(asyncStorageKeys);
    }
  }
};
