import SharedGroupPreferences from "react-native-shared-group-preferences";

import config from "../config";

const appGroup = `group.${config.bundleId}`;

export const saveConversationDict = (topic: string, conversationDict: any) =>
  SharedGroupPreferences.setItem(
    `conversation-${topic}`,
    conversationDict,
    appGroup
  );

export const saveXmtpEnv = () =>
  SharedGroupPreferences.setItem("xmtp-env", config.xmtpEnv, appGroup);

export const loadSavedNotificationsMessages = () =>
  SharedGroupPreferences.getItem("saved-notifications-messages", appGroup);

export const emptySavedNotificationsMessages = () =>
  SharedGroupPreferences.setItem("saved-notifications-messages", [], appGroup);

export const saveLoggedXmtpAddress = (address: string) =>
  SharedGroupPreferences.setItem("xmtp-address", address, appGroup);

export const deleteLoggedXmtpAddress = () =>
  SharedGroupPreferences.setItem("xmtp-address", undefined, appGroup);

export const saveApiURI = () =>
  SharedGroupPreferences.setItem("api-uri", config.apiURI, appGroup);
