import * as Linking from "expo-linking";
import { Linking as RNLinking } from "react-native";

import logger from "./logger";
import config from "../config";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { NavigationContainerRef } from "@react-navigation/native";

let converseNavigatorRef: NavigationContainerRef<NavigationParamList> | null =
  null;

export const setConverseNavigatorRef = (
  ref: NavigationContainerRef<NavigationParamList> | null
) => {
  if (converseNavigatorRef) {
    logger.error("[Navigation] Conversation navigator ref already set");
    return;
  }
  if (!ref) {
    logger.error("[Navigation] Conversation navigator ref is null");
    return;
  }
  converseNavigatorRef = ref;
};

export const navigate = async <T extends keyof NavigationParamList>(
  screen: T,
  params?: NavigationParamList[T]
) => {
  if (!converseNavigatorRef) {
    logger.error("[Navigation] Conversation navigator not found");
    return;
  }

  if (!converseNavigatorRef.isReady()) {
    logger.error(
      "[Navigation] Conversation navigator is not ready (wait for appStore#hydrated to be true using waitForAppStoreHydration)"
    );
    return;
  }

  logger.debug(
    `[Navigation] Navigating to ${screen} ${
      params ? JSON.stringify(params) : ""
    }`
  );

  // todo(any): figure out proper typing here
  // @ts-ignore
  converseNavigatorRef.navigate(screen, params);
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
