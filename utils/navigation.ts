import * as Linking from "expo-linking";
import { Linking as RNLinking } from "react-native";

import logger from "./logger";
import config from "../config";
import { currentAccount, getChatStore } from "../data/store/accountsStore";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import type { ConversationWithCodecsType } from "./xmtpRN/client.types";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const converseNavigations: { [navigationName: string]: any } = {};

export const navigate = async <T extends keyof NavigationParamList>(
  screen: T,
  params?: NavigationParamList[T]
) => {
  logger.debug(
    `[Navigation] Navigating to ${screen} ${
      params ? JSON.stringify(params) : ""
    }`
  );
  // Navigate to a screen in all navigators
  // like Linking.openURL but without redirect on web
  Object.values(converseNavigations).forEach((navigation) => {
    navigation.navigate(screen, params);
  });
};

export let topicToNavigateTo: string | undefined = undefined;
export const setTopicToNavigateTo = (topic: string | undefined) => {
  topicToNavigateTo = topic;
};

export const navigateToTopic = async (topic: ConversationTopic) => {
  navigate("Conversation", { topic });
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
