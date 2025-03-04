import * as Linking from "expo-linking"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"

type OpenLinkArgs = {
  url: string
  fallbackUrl?: string
}

/**
 * Opens a URL in the default browser or appropriate app
 * Falls back to provided fallbackUrl if the main URL fails
 */
export async function openLink(args: OpenLinkArgs) {
  const { url, fallbackUrl } = args

  try {
    const canOpen = await Linking.canOpenURL(url)

    if (!canOpen) {
      if (fallbackUrl) {
        await Linking.openURL(fallbackUrl)
        return
      }
      throw new Error(`Cannot open URL: ${url}`)
    }

    await Linking.openURL(url)
  } catch (error) {
    throw new GenericError({
      error,
      additionalMessage: `Failed to open URL: ${url}`,
    })
  }
}

/**
 * Opens device settings for the current app
 */
export async function openAppSettings() {
  try {
    await Linking.openSettings()
  } catch (error) {
    throw new GenericError({
      error,
      additionalMessage: "Failed to open app settings",
    })
  }
}

/**
 * Creates a deep link URL for the app with optional path and parameters
 */
export function createDeepLink(args: { path?: string; queryParams?: Record<string, string> }) {
  const { path = "", queryParams } = args

  return Linking.createURL(path, {
    queryParams,
    // Use triple slashes for more reliable deep linking
    isTripleSlashed: true,
  })
}

/**
 * Parses a deep link URL into its components
 */
export function parseDeepLink(url: string) {
  try {
    return Linking.parse(url)
  } catch (error) {
    captureError(
      new GenericError({
        error,
        additionalMessage: `Failed to parse deep link: ${url}`,
      }),
    )
    return null
  }
}

/**
 * Gets the initial URL used to open the app, if any
 */
export async function getInitialURL() {
  try {
    return await Linking.getInitialURL()
  } catch (error) {
    captureError(
      new GenericError({
        error,
        additionalMessage: "Failed to get initial URL",
      }),
    )
    return null
  }
}

/**
 * Subscribe to URL open events
 */
export function subscribeToURLEvents(listener: (url: string) => void) {
  return Linking.addEventListener("url", (event) => {
    listener(event.url)
  })
}
