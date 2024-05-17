import config from "../config";
import { addLog } from "./debug";
import mmkv from "./mmkv";
import { sentryTrackError } from "./sentry";

export const saveConversationDict = (topic: string, conversationDict: any) =>
  mmkv.set(`conversation-${topic}`, JSON.stringify(conversationDict));

export const saveXmtpEnv = () => mmkv.set("xmtp-env", config.xmtpEnv);

export const loadSavedNotificationsMessages = () => {
  addLog("loadSavedNotificationMessagesToContext loading from MMKV");
  const value = mmkv.getString("saved-notifications-messages");
  addLog(`loadSavedNotificationMessagesToContext loaded from MMKV - ${value}`);
  if (value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      addLog(`loadSavedNotificationMessagesToContext mmkv error : ${e}`);
      sentryTrackError(e);
      return [];
    }
  } else {
    addLog("loadSavedNotificationMessagesToContext no value loading from MMKV");
  }
  return [];
};

export const emptySavedNotificationsMessages = () =>
  mmkv.delete("saved-notifications-messages");

export const loadSavedNotificationsConversations = () => {
  const value = mmkv.getString("saved-notifications-conversations");
  if (value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  return [];
};

export const emptySavedNotificationsConversations = () =>
  mmkv.delete("saved-notifications-conversations");

export const saveApiURI = () => mmkv.set("api-uri", config.apiURI);

export const resetSharedData = (topics: string[]) => {
  addLog("Emptying notif messages 3");
  emptySavedNotificationsMessages();
  emptySavedNotificationsConversations();
  topics.forEach((t) => {
    mmkv.delete(`conversation-${t}`);
  });
};
