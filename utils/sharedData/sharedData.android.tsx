/*
On Android since we can decode notifications directly in Javascript we don't need
to use shared data storing. And since this SharedGroupPreferences lib seems to be
unmaintained let's just fallback to regular storage through MMKV
*/
import { DecodedMessage } from "@xmtp/xmtp-js";

import config from "../../config";
import storage from "../mmkv";

export const saveConversationDict = async (
  topic: string,
  conversationDict: any
) => storage.set(`conversation-${topic}`, JSON.stringify(conversationDict));

export const loadConversationDict = async (topic: string) => {
  const jsonDict = storage.getString(`conversation-${topic}`);
  if (!jsonDict) return {};
  try {
    const dict = JSON.parse(jsonDict);
    return dict;
  } catch (error) {
    console.log(error);
    return {};
  }
};

export const saveXmtpEnv = async () => storage.set("xmtp-env", config.xmtpEnv);

export const loadSavedNotificationsMessages = async () => {
  const jsonMessages = storage.getString("saved-notifications-messages");
  if (!jsonMessages) return [];
  try {
    const messages = JSON.parse(jsonMessages);
    return messages;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const saveNewNotificationMessage = async (
  topic: string,
  message: DecodedMessage
) => {
  const currentMessages = await loadSavedNotificationsMessages();
  currentMessages.push({
    topic,
    id: message.id,
    senderAddress: message.senderAddress,
    sent: message.sent.getTime(),
    content: message.content,
  });
  storage.set("saved-notifications-messages", JSON.stringify(currentMessages));
};

export const emptySavedNotificationsMessages = async () =>
  storage.delete("saved-notifications-messages");

export const saveApiURI = async () => storage.set("api-uri", config.apiURI);

export const saveLoggedXmtpAddress = async (address: string) =>
  storage.set("xmtp-address", address);

export const deleteLoggedXmtpAddress = async () =>
  storage.delete("xmtp-address");

export const getLoggedXmtpAddress = async () =>
  storage.getString("xmtp-address");
