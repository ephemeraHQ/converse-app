/*
On Android since we the notification Kotlin code is part of the app we don't need
to use shared data storing. And since this SharedGroupPreferences lib seems to be
unmaintained let's just fallback to regular storage through AsyncStorage
*/
import AsyncStorage from "@react-native-async-storage/async-storage";

import config from "../../config";

export const saveConversationDict = (topic: string, conversationDict: any) =>
  AsyncStorage.setItem(
    `conversation-${topic}`,
    JSON.stringify(conversationDict)
  );

export const loadConversationDict = async (topic: string) => {
  const jsonDict = await AsyncStorage.getItem(`conversation-${topic}`);
  if (!jsonDict) return {};
  try {
    const dict = JSON.parse(jsonDict);
    return dict;
  } catch (error) {
    console.log(error);
    return {};
  }
};

export const saveXmtpEnv = () =>
  AsyncStorage.setItem("xmtp-env", config.xmtpEnv);

export const loadSavedNotificationsMessages = async () => {
  const jsonMessages = await AsyncStorage.getItem(
    "saved-notifications-messages"
  );
  if (!jsonMessages) return [];
  try {
    const messages = JSON.parse(jsonMessages);
    return messages;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const emptySavedNotificationsConversations = () =>
  AsyncStorage.setItem("saved-notifications-conversations", "[]");

export const loadSavedNotificationsConversations = async () => {
  const jsonConversations = await AsyncStorage.getItem(
    "saved-notifications-conversations"
  );
  if (!jsonConversations) return [];
  try {
    const conversations = JSON.parse(jsonConversations);
    return conversations;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const emptySavedNotificationsMessages = () =>
  AsyncStorage.setItem("saved-notifications-messages", "[]");

export const saveApiURI = () => AsyncStorage.setItem("api-uri", config.apiURI);

export const saveLoggedXmtpAddress = (address: string) =>
  AsyncStorage.setItem("xmtp-address", address);

export const deleteLoggedXmtpAddress = () =>
  AsyncStorage.removeItem("xmtp-address");

export const getLoggedXmtpAddress = () => AsyncStorage.getItem("xmtp-address");

export const resetSharedData = () => {
  emptySavedNotificationsMessages();
  deleteLoggedXmtpAddress();
};
