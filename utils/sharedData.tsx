import SharedGroupPreferences from "react-native-shared-group-preferences";

import config from "../config";

export const saveConversationDict = (topic: string, conversationDict: any) =>
  SharedGroupPreferences.setItem(
    `conversation-${topic}`,
    conversationDict,
    "group.com.converse"
  );

export const saveXmtpEnv = () =>
  SharedGroupPreferences.setItem(
    "xmtp-env",
    config.xmtpEnv,
    "group.com.converse"
  );

export const loadSavedNotificationsMessages = async () => {
  const result = await SharedGroupPreferences.getItem(
    "saved-notifications-messages",
    "group.com.converse"
  );
  console.log("SAVED NOTIFS", result);
};
