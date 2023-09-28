import config from "../config";
import mmkv from "./mmkv";

export const saveConversationDict = (topic: string, conversationDict: any) =>
  mmkv.set(`conversation-${topic}`, JSON.stringify(conversationDict));

export const saveXmtpEnv = () => mmkv.set("xmtp-env", config.xmtpEnv);

export const loadSavedNotificationsMessages = () => {
  const value = mmkv.getString("saved-notifications-messages");
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
  emptySavedNotificationsMessages();
  emptySavedNotificationsConversations();
  topics.forEach((t) => {
    mmkv.delete(`conversation-${t}`);
  });
};
