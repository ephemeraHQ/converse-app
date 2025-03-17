import { createNavigationContainerRef } from "@react-navigation/native"
import * as Linking from "expo-linking"
import { Linking as RNLinking } from "react-native"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { config } from "../config"
import logger from "../utils/logger"
import { NavigationParamList } from "./navigation.types"

// https://reactnavigation.org/docs/navigating-without-navigation-prop/#usage
export const navigationRef = createNavigationContainerRef()

export const navigate = async <T extends keyof NavigationParamList>(
  screen: T,
  params?: NavigationParamList[T],
) => {
  logger.debug("[Navigation] Navigating to:", screen, params)
  if (!navigationRef) {
    logger.error("[Navigation] Conversation navigator not found")
    return
  }

  if (!navigationRef.isReady()) {
    logger.error(
      "[Navigation] Conversation navigator is not ready (wait for appStore#hydrated to be true using waitForAppStoreHydration)",
    )
    return
  }

  logger.debug(`[Navigation] Navigating to ${screen} ${params ? JSON.stringify(params) : ""}`)

  // todo(any): figure out proper typing here
  // @ts-ignore
  navigationRef.navigate(screen, params)
}

export const getSchemedURLFromUniversalURL = (url: string) => {
  // Handling universal links by saving a schemed URI
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      return Linking.createURL(url.replace(prefix, ""))
    }
  }
  return url
}

const isDMLink = (url: string) => {
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length)
      if (path.toLowerCase().startsWith("dm/")) {
        return true
      }
    }
  }
  return false
}

const isGroupLink = (url: string) => {
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length)
      if (path.toLowerCase().startsWith("group/")) {
        return true
      }
    }
  }
  return false
}

const originalOpenURL = RNLinking.openURL.bind(RNLinking)
RNLinking.openURL = (url: string) => {
  logger.debug("[Navigation] Processing URL:", url)

  try {
    if (isDMLink(url)) {
      logger.debug("[Navigation] Handling DM link")
      return originalOpenURL(getSchemedURLFromUniversalURL(url))
    }
    if (isGroupLink(url)) {
      logger.debug("[Navigation] Handling group link")
      return originalOpenURL(getSchemedURLFromUniversalURL(url))
    }
    logger.debug("[Navigation] Handling default link")
    return originalOpenURL(url)
  } catch (error) {
    logger.error("[Navigation] Error processing URL:", error)
    return Promise.reject(error)
  }
}

export function getCurrentRoute() {
  return navigationRef.getCurrentRoute()
}
