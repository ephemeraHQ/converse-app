import AsyncStorage from "@react-native-async-storage/async-storage";

import { resetLocalXmtpState } from "../components/XmtpState";
import { sendMessageToWebview } from "../components/XmtpWebview";
import { clearDB } from "../data/db";
import { DispatchType, StateType } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { deleteXmtpConversations } from "./keychain";
import mmkv from "./mmkv";
import { disablePushNotifications } from "./notifications";

export const logout = async (state: StateType, dispatch: DispatchType) => {
  // Deleting all keychain values for conversations
  const knownConversationsTopics = Object.keys(state.xmtp.conversations);
  deleteXmtpConversations(knownConversationsTopics);
  // Resetting the local XMTP client
  resetLocalXmtpState();
  // Clearing the Sqlite db
  clearDB();
  // Unsubscribing from notifications
  disablePushNotifications();
  // Disconnecting from the webview xmtp client
  sendMessageToWebview("DISCONNECT");
  // Clearing Async storage and mmkv
  AsyncStorage.clear();
  mmkv.clearAll();
  // Re-showing the notification screen if notifications
  // are disabled
  setTimeout(() => {
    dispatch({
      type: NotificationsDispatchTypes.NotificationsShowScreen,
      payload: {
        show: true,
      },
    });
  }, 500);
};
