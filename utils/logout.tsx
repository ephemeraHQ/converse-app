import AsyncStorage from "@react-native-async-storage/async-storage";
import RNRestart from "react-native-restart";

import { resetLocalXmtpState } from "../components/XmtpState";
import { clearDB } from "../data/db";
import { DispatchType, StateType } from "../data/store/context";
import { deleteXmtpConversations, deleteXmtpKeys } from "./keychain";
import mmkv from "./mmkv";
import { disablePushNotifications } from "./notifications";
import { resetSharedData } from "./sharedData/sharedData";

export const logout = async (state: StateType, dispatch: DispatchType) => {
  const promisesToAwait: any[] = [];
  // Delete shared data
  promisesToAwait.push(resetSharedData());
  // Delete keychain xmtp
  promisesToAwait.push(deleteXmtpKeys());
  // Deleting all keychain values for conversations
  const knownConversationsTopics = Object.keys(state.xmtp.conversations);
  promisesToAwait.push(deleteXmtpConversations(knownConversationsTopics));
  // Resetting the local XMTP client
  promisesToAwait.push(resetLocalXmtpState());
  // Clearing the Sqlite db
  promisesToAwait.push(clearDB());
  // Unsubscribing from notifications
  promisesToAwait.push(disablePushNotifications());
  // Clearing Async storage and mmkv
  promisesToAwait.push(AsyncStorage.clear());
  promisesToAwait.push(mmkv.clearAll());
  await Promise.all(promisesToAwait);
  RNRestart.restart();
};
