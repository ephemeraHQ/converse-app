/*
On iOS to decode notifications coming from XMTP we developed a notification
extension in Swift. This extension needs to access some data, to do so
we use this lib "SharedGroupPreferences" that enables us to share data
with other apps (the extension is "another app") through Apple App Groups
*/

import SharedGroupPreferences from "react-native-shared-group-preferences";

import config from "../../config";

export const saveConversationDict = (topic: string, conversationDict: any) =>
  SharedGroupPreferences.setItem(
    `conversation-${topic}`,
    conversationDict,
    config.appleAppGroup
  );

export const saveXmtpEnv = () =>
  SharedGroupPreferences.setItem(
    "xmtp-env",
    config.xmtpEnv,
    config.appleAppGroup
  );

export const loadSavedNotificationsMessages = () =>
  SharedGroupPreferences.getItem(
    "saved-notifications-messages",
    config.appleAppGroup
  );

export const emptySavedNotificationsMessages = () =>
  SharedGroupPreferences.setItem(
    "saved-notifications-messages",
    [],
    config.appleAppGroup
  );

export const loadSavedNotificationsConversations = () =>
  SharedGroupPreferences.getItem(
    "saved-notifications-conversations",
    config.appleAppGroup
  );

export const emptySavedNotificationsConversations = () =>
  SharedGroupPreferences.setItem(
    "saved-notifications-conversations",
    [],
    config.appleAppGroup
  );

export const saveApiURI = () =>
  SharedGroupPreferences.setItem(
    "api-uri",
    config.apiURI,
    config.appleAppGroup
  );

export const resetSharedData = (topics: string[]) => {
  emptySavedNotificationsMessages();
  emptySavedNotificationsConversations();
  topics.forEach((t) => {
    SharedGroupPreferences.setItem(
      `conversation-${t}`,
      null,
      config.appleAppGroup
    );
  });
};
