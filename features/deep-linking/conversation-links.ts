import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { findConversationByInboxIds } from "@/features/conversation/utils/find-conversations-by-inbox-ids"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { logger } from "@/utils/logger"

/**
 * Check if a conversation exists with the given inboxId
 * @param inboxId The inbox ID to check
 * @returns Promise with { exists, conversationId } - where conversationId is set if exists is true
 */
export async function checkConversationExists(inboxId: IXmtpInboxId): Promise<{ exists: boolean, conversationId?: IXmtpConversationId }> {
  try {
    // Get active user's inbox ID
    const state = useMultiInboxStore.getState()
    const activeInboxId = state.currentSender?.inboxId
    
    if (!activeInboxId) {
      logger.warn("Cannot check conversation existence - no active inbox")
      return { exists: false }
    }
    
    // Try to find an existing conversation
    const conversation = await findConversationByInboxIds({
      inboxIds: [inboxId],
      clientInboxId: activeInboxId,
    })
    
    if (conversation) {
      logger.info(`Found existing conversation with ID: ${conversation.xmtpId}`)
      return { 
        exists: true, 
        conversationId: conversation.xmtpId as IXmtpConversationId 
      }
    }
    
    return { exists: false }
  } catch (error) {
    logger.warn(`Error checking conversation existence: ${error}`)
    return { exists: false }
  }
} 