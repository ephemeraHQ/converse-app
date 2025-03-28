import { useCallback } from "react"
import { useNavigation } from "@react-navigation/native"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { IXmtpInboxId, IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { logger } from "@/utils/logger"
import { checkConversationExists } from "./conversation-links"

/**
 * Custom hook to handle conversation deep links
 * This is used by the DeepLinkHandler component to navigate to conversations from deep links
 */
export function useConversationDeepLinkHandler() {
  const navigation = useNavigation()
  
  /**
   * Process an inbox ID from a deep link and navigate to the appropriate conversation
   * @param inboxId The inbox ID from the deep link
   * @param composerTextPrefill Optional text to prefill in the composer
   */
  const handleConversationDeepLink = useCallback(async (
    inboxId: IXmtpInboxId, 
    composerTextPrefill?: string
  ) => {
    if (!inboxId) {
      logger.warn("Cannot handle conversation deep link - missing inboxId")
      return
    }

    try {
      logger.info(`Handling conversation deep link for inboxId: ${inboxId}${composerTextPrefill ? ' with prefill text' : ''}`)
      
      // Check if the conversation exists
      const { exists, conversationId } = await checkConversationExists(inboxId)
      
      if (exists && conversationId) {
        // We have an existing conversation - navigate to it
        logger.info(`Found existing conversation with ID: ${conversationId}`)
        
        navigation.navigate("Conversation", {
          xmtpConversationId: conversationId,
          isNew: false,
          composerTextPrefill
        })
      } else {
        // No existing conversation - start a new one
        logger.info(`No existing conversation found with inboxId: ${inboxId}, creating new conversation`)
        
        navigation.navigate("Conversation", {
          searchSelectedUserInboxIds: [inboxId],
          isNew: true,
          composerTextPrefill
        })
      }
    } catch (error) {
      captureError(
        new GenericError({
          error,
          additionalMessage: `Failed to handle conversation deep link for inboxId: ${inboxId}`,
          extra: { inboxId }
        })
      )
    }
  }, [navigation])

  return { handleConversationDeepLink }
}

/**
 * Global function to process a new deep link that uses the ConversationScreenConfig format
 * This function is called by the navigation library when it receives a deep link
 */
export function processConversationDeepLink(
  params: Record<string, string | undefined>
): Promise<boolean> {
  return new Promise(async (resolve) => {
    const { inboxId, composerTextPrefill } = params
    
    if (!inboxId) {
      // Skip if no inboxId
      logger.warn("Cannot process conversation deep link - missing inboxId")
      resolve(false)
      return
    }
    
    try {
      logger.info(`Processing Conversation deep link via navigation for inboxId: ${inboxId}${composerTextPrefill ? ' with prefill text' : ''}`)
      
      // Check if the conversation exists
      const { exists, conversationId } = await checkConversationExists(inboxId as IXmtpInboxId)
      
      if (exists && conversationId) {
        logger.info(`Navigation found existing conversation with ID: ${conversationId}`)
        resolve(true)
        return
      }
      
      // We didn't find an existing conversation, so we'll create a new one
      logger.info(`No existing conversation found with inboxId: ${inboxId}, navigation will create a new conversation`)
      resolve(true)
    } catch (error) {
      logger.error(`Error in processConversationDeepLink: ${error}`)
      // Still return true to indicate we're handling it, even though there was an error
      resolve(true)
    }
  })
} 