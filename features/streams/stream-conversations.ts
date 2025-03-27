import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { StreamError } from "@utils/error"
import { addConversationToAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { addConversationToUnknownConsentConversationsQuery } from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown"
import { streamConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-stream"
import { captureError } from "@/utils/capture-error"
import { streamLogger } from "@/utils/logger"
import { IConversation } from "../conversation/conversation.types"

export async function startConversationStreaming(args: { clientInboxId: IXmtpInboxId }) {
  const { clientInboxId } = args

  try {
    await streamConversations({
      inboxId: clientInboxId,
      onNewConversation: async (conversation) =>
        handleNewConversation({
          clientInboxId,
          conversation: await convertXmtpConversationToConvosConversation(conversation),
        }).catch(captureError),
    })
  } catch (error) {
    throw new StreamError({
      error,
      additionalMessage: `Failed to stream conversations for ${clientInboxId}`,
    })
  }
}

async function handleNewConversation(args: {
  clientInboxId: IXmtpInboxId
  conversation: IConversation
}) {
  const { clientInboxId, conversation } = args

  streamLogger.debug(`[Stream] Received new conversation for ${clientInboxId}:`, conversation)

  if (isConversationAllowed(conversation)) {
    addConversationToAllowedConsentConversationsQuery({
      clientInboxId,
      conversationId: conversation.xmtpId,
    })
  } else if (isConversationConsentUnknown(conversation)) {
    addConversationToUnknownConsentConversationsQuery({
      clientInboxId,
      conversationId: conversation.xmtpId,
    })
  }
}
