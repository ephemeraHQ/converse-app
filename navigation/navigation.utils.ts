import { createNavigationContainerRef } from "@react-navigation/native"
import * as Linking from "expo-linking"
import { Linking as RNLinking } from "react-native"
import { captureError } from "@/utils/capture-error"
import { NavigationError } from "@/utils/error"
import { waitUntilPromise } from "@/utils/wait-until-promise"
import { config } from "../config"
import logger from "../utils/logger"
import { NavigationParamList } from "./navigation.types"

// https://reactnavigation.org/docs/navigating-without-navigation-prop/#usage
export const navigationRef = createNavigationContainerRef()

export function waitUntilNavigationReady(args: { timeoutMs?: number } = {}) {
  return waitUntilPromise({
    checkFn: () => navigationRef.isReady(),
    intervalMs: 100,
    timeoutMs: args.timeoutMs,
  })
}

export async function navigate<T extends keyof NavigationParamList>(
  screen: T,
  params?: NavigationParamList[T],
) {
  try {
    if (!navigationRef) {
      captureError(
        new NavigationError({
          error: "Navigation navigator not found",
        }),
      )
      return
    }

    if (!navigationRef.isReady()) {
      captureError(
        new NavigationError({
          error: "Navigation navigator is not ready, so we're waiting...",
        }),
      )
      await waitUntilNavigationReady({
        // After 10 seconds, the UX will feel very broken from a user perspective...
        timeoutMs: 10000,
      })
    }

    logger.debug(`[Navigation] Navigating to ${screen} ${params ? JSON.stringify(params) : ""}`)

    // @ts-ignore
    navigationRef.navigate(screen, params)
  } catch (error) {
    captureError(
      new NavigationError({
        error,
        additionalMessage: "Error navigating to screen",
      }),
    )
  }
}
export const getSchemedURLFromUniversalURL = (url: string) => {
  // Handling universal links by saving a schemed URI
  for (const prefix of config.app.universalLinks) {
    if (url.startsWith(prefix)) {
      return Linking.createURL(url.replace(prefix, ""))
    }
  }
  return url
}

const isDMLink = (url: string) => {
  for (const prefix of config.app.universalLinks) {
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
  for (const prefix of config.app.universalLinks) {
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
    captureError(
      new NavigationError({
        error,
        additionalMessage: "Error processing URL",
      }),
    )
    return Promise.reject(error)
  }
}

export function getCurrentRoute() {
  return navigationRef.getCurrentRoute()
}
