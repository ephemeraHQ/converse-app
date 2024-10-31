import { IScreenName, NavigationParamList } from "@navigation/Navigation.types";
import { navigationRef } from "@screens/Navigation/navHelpers";
import * as Linking from "expo-linking";
import { Linking as RNLinking } from "react-native";

import config from "../config";
import logger from "./logger";
import { loadSavedNotificationMessagesToContext } from "./notifications";
import { currentAccount, getChatStore } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";

export const navigate = async <T extends IScreenName>(
  screen: T,
  params?: NavigationParamList[T]
) => {
  logger.debug(
    `[Navigation] Navigating to ${screen} ${
      params ? JSON.stringify(params) : ""
    }`
  );

  if (!navigationRef.current) {
    logger.error("[Navigation] Navigation ref is not set");
    return;
  }

  // @ts-expect-error
  navigationRef.current.navigate(screen, params);
};

export let topicToNavigateTo = "";
export const setTopicToNavigateTo = (topic: string) => {
  topicToNavigateTo = topic;
};

export const navigateToConversation = async (
  conversation: XmtpConversation
) => {
  await loadSavedNotificationMessagesToContext();
  navigate("Conversation", { topic: conversation.topic });
};

export const navigateToTopicWithRetry = async () => {
  if (!topicToNavigateTo) return;
  let conversationToNavigateTo = getChatStore(currentAccount()).getState()
    .conversations[topicToNavigateTo];
  let currentAttempt = 0;

  while (
    !conversationToNavigateTo &&
    currentAttempt < 10 &&
    topicToNavigateTo
  ) {
    currentAttempt += 1;
    await new Promise((r) => setTimeout(r, 250));
    conversationToNavigateTo = getChatStore(currentAccount()).getState()
      .conversations[topicToNavigateTo];
  }

  if (topicToNavigateTo && conversationToNavigateTo) {
    navigateToConversation(conversationToNavigateTo);
  }
};

export const getSchemedURLFromUniversalURL = (url: string) => {
  // Handling universal links by saving a schemed URI
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      return Linking.createURL(url.replace(prefix, ""));
    }
  }
  return url;
};

const isDMLink = (url: string) => {
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length);
      if (path.toLowerCase().startsWith("dm/")) {
        return true;
      }
    }
  }
  return false;
};

const isGroupInviteLink = (url: string) => {
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length);
      if (path.toLowerCase().startsWith("group-invite/")) {
        return true;
      }
    }
  }
};

const isGroupLink = (url: string) => {
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length);
      if (path.toLowerCase().startsWith("group/")) {
        return true;
      }
    }
  }
};

const originalOpenURL = RNLinking.openURL.bind(RNLinking);
RNLinking.openURL = (url: string) => {
  // If the URL is a DM link, open it inside the app
  // as a deeplink, not the browser
  if (isDMLink(url)) {
    return originalOpenURL(getSchemedURLFromUniversalURL(url));
  }
  if (isGroupInviteLink(url)) {
    return originalOpenURL(getSchemedURLFromUniversalURL(url));
  }
  if (isGroupLink(url)) {
    return originalOpenURL(getSchemedURLFromUniversalURL(url));
  }
  return originalOpenURL(url);
};
