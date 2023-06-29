import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import RNRestart from "react-native-restart";

import { clearDB } from "../data/db";
import { DispatchType, StateType } from "../data/store/context";
import { deleteXmtpConversations, deleteXmtpKeys } from "./keychain";
import mmkv from "./mmkv";
import { disablePushNotifications } from "./notifications";
import { resetSharedData } from "./sharedData/sharedData";

export const logout = async (state: StateType, dispatch: DispatchType) => {
  await cleanupBeforeLogout(state);
  mmkv.set("converse-logout", true);
  RNRestart.restart();
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

const cleanupBeforeLogout = async (state: StateType) => {
  const promisesToAwait: any[] = [];
  // Deleting all keychain values for conversations
  // need state so can't do it after logout
  const knownConversationsTopics = Object.keys(state.xmtp.conversations);
  promisesToAwait.push(deleteXmtpConversations(knownConversationsTopics));
  // Unsubscribing from notifications
  promisesToAwait.push(disablePushNotifications());
  // Delete keychain xmtp
  promisesToAwait.push(deleteXmtpKeys());
  // Clearing the Sqlite db
  promisesToAwait.push(clearDB(false));
  // Delete shared data
  promisesToAwait.push(resetSharedData());
  // Clearing Async storage and mmkv
  promisesToAwait.push(clearAsyncStorage());
  promisesToAwait.push(mmkv.clearAll());
  await Promise.all(promisesToAwait);
};

export const cleanupAfterLogout = async () => {
  const promisesToAwait: any[] = [];
  // Delete keychain xmtp
  promisesToAwait.push(deleteXmtpKeys());
  // Delete shared data
  promisesToAwait.push(resetSharedData());
  // Clearing Async storage and mmkv
  promisesToAwait.push(clearAsyncStorage());
  promisesToAwait.push(mmkv.clearAll());
  await Promise.all(promisesToAwait);
};
