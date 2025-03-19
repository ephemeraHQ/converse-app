import { IConversationMessageContent } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import {
  messageContentIsGroupUpdated,
  messageContentIsMultiRemoteAttachment,
  messageContentIsReaction,
  messageContentIsRemoteAttachment,
  messageContentIsReply,
  messageContentIsStaticAttachment,
  messageContentIsText,
} from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { IXmtpConversationSendPayload } from "@/features/xmtp/xmtp.types"

/**
 * Converts our internal message content to XMTP-compatible payload
 * Handles all supported content types with appropriate conversion
 */
export function convertConvosMessageContentToXmtpMessageContent(
  content: IConversationMessageContent,
): IXmtpConversationSendPayload {
  if (messageContentIsText(content)) {
    return { text: content.text }
  } else if (messageContentIsRemoteAttachment(content)) {
    return {
      remoteAttachment: {
        filename: content.filename,
        secret: content.secret,
        salt: content.salt,
        nonce: content.nonce,
        contentDigest: content.contentDigest,
        scheme: content.scheme,
        url: content.url,
        contentLength: content.contentLength,
      },
    }
  } else if (messageContentIsMultiRemoteAttachment(content)) {
    return {
      multiRemoteAttachment: {
        attachments: content.attachments.map((attachment) => ({
          filename: attachment.filename,
          secret: attachment.secret,
          salt: attachment.salt,
          nonce: attachment.nonce,
          contentDigest: attachment.contentDigest,
          scheme: attachment.scheme,
          url: attachment.url,
          contentLength: attachment.contentLength,
        })),
      },
    }
  } else if (messageContentIsReaction(content)) {
    return {
      reaction: {
        reference: content.reference,
        action: content.action,
        schema: content.schema,
        content: content.content,
      },
    }
  } else if (messageContentIsReply(content)) {
    // Handle reply messages by recursively converting the nested content
    // With our modified IXmtpConversationSendPayload type (object-only),
    // this works correctly with the reply.content requirements
    return {
      reply: {
        reference: content.reference,
        content: convertConvosMessageContentToXmtpMessageContent(content.content),
      },
    }
  } else if (messageContentIsStaticAttachment(content)) {
    return {
      attachment: {
        filename: content.filename,
        mimeType: content.mimeType,
        data: content.data,
      },
    }
  } else if (messageContentIsGroupUpdated(content)) {
    return {
      groupUpdated: {
        initiatedByInboxId: content.initiatedByInboxId,
        membersAdded: content.membersAdded,
        membersRemoved: content.membersRemoved,
        metadataFieldsChanged: content.metadataFieldsChanged,
      },
    }
  }

  // Default case - if no specific handler exists, try to send as text
  return { text: JSON.stringify(content) }
}
