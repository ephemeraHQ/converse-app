import { useCallback, useEffect } from "react"
import { Linking } from "react-native"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { useAppState } from "@/stores/use-app-state-store"
import { logger } from "@/utils/logger"
import { parseURL } from "./link-parser"
import { useConversationDeepLinkHandler } from "./conversation-navigator"

/**
 * Component that handles deep links for the app
 * This should be included at the app root to handle incoming links
 */
export function DeepLinkHandler() {
  const { currentState } = useAppState.getState()
  const { handleConversationDeepLink } = useConversationDeepLinkHandler()

  /**
   * Handle a URL by parsing it and routing to the appropriate handler
   */
  const handleUrl = useCallback(async (url: string) => {
    logger.info(`Handling deep link URL: ${url}`)
    
    const { segments, params } = parseURL(url)
    
    // Handle different types of deep links based on the URL pattern
    if (segments[0] === "conversation" && segments[1]) {
      // Pattern: converse://conversation/{inboxId}
      const inboxId = segments[1] as IXmtpInboxId
      const composerTextPrefill = params.composerTextPrefill
      
      logger.info(`Deep link matches conversation pattern, inboxId: ${inboxId}${
        composerTextPrefill ? `, composerTextPrefill: ${composerTextPrefill}` : ''
      }`)
      
      // Use the conversation deep link handler
      await handleConversationDeepLink(inboxId, composerTextPrefill)
    } else {
      logger.info(`Unhandled deep link pattern: ${segments.join('/')}`)
    }
  }, [handleConversationDeepLink])

  // Handle initial URL when the app is first launched
  useEffect(() => {
    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL()
        if (initialUrl) {
          logger.info(`App launched from deep link: ${initialUrl}`)
          handleUrl(initialUrl)
        }
      } catch (error) {
        logger.warn(`Error getting initial URL: ${error}`)
      }
    }

    getInitialURL()
  }, [handleUrl])

  // Listen for URL events when the app is running
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      logger.info(`Received deep link while running: ${url}`)
      handleUrl(url)
    })

    return () => {
      subscription.remove()
    }
  }, [handleUrl, currentState])

  // This is a utility component with no UI
  return null
}
