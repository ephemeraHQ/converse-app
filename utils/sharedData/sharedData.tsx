/*
On iOS to decode notifications coming from XMTP we developed a notification
extension in Swift. This extension needs to access some data, to do so
we use this lib "SharedGroupPreferences" that enables us to share data
with other apps (the extension is "another app") through Apple App Groups
*/

import SharedGroupPreferences from "react-native-shared-group-preferences";

import config from "../../config";

const appGroup = `group.${config.bundleId}`;

export const saveConversationDict = (topic: string, conversationDict: any) =>
  SharedGroupPreferences.setItem(
    `conversation-${topic}`,
    conversationDict,
    appGroup
  );

export const loadConversationDict = (topic: string) =>
  SharedGroupPreferences.getItem(`conversation-${topic}`, appGroup);

export const saveXmtpEnv = () =>
  SharedGroupPreferences.setItem("xmtp-env", config.xmtpEnv, appGroup);

export const loadSavedNotificationsMessages = () =>
  SharedGroupPreferences.getItem("saved-notifications-messages", appGroup);

export const emptySavedNotificationsMessages = () =>
  SharedGroupPreferences.setItem("saved-notifications-messages", [], appGroup);

export const loadSavedNotificationsConversations = () =>
  SharedGroupPreferences.getItem("saved-notifications-conversations", appGroup);

export const emptySavedNotificationsConversations = () =>
  SharedGroupPreferences.setItem(
    "saved-notifications-conversations",
    [],
    appGroup
  );

export const saveApiURI = () =>
  SharedGroupPreferences.setItem("api-uri", config.apiURI, appGroup);

export const saveLoggedXmtpAddress = (address: string) =>
  SharedGroupPreferences.setItem("xmtp-address", address, appGroup);

export const deleteLoggedXmtpAddress = () =>
  SharedGroupPreferences.setItem("xmtp-address", "", appGroup);

export const getLoggedXmtpAddress = () =>
  SharedGroupPreferences.getItem("xmtp-address", appGroup);

export const resetSharedData = () => {
  emptySavedNotificationsMessages();
  deleteLoggedXmtpAddress();
};
