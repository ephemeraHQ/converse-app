import {
  IXmtpDecodedMessageNativeContent,
  IXmtpInboxId,
  IXmtpMessageId,
} from "@/features/xmtp/xmtp.types"
import { IConversationMessageContent } from "../conversation-message.types"

// XMTP reply content is weird, not the same as a normal message content so we need
// this function to convert it to our format
export function convertXmtpReplyContentToConvosContent(
  content: IXmtpDecodedMessageNativeContent, // that's the type of the content in the XMTP reply message
): IConversationMessageContent {
  // Handle remote attachments
  if (content.remoteAttachment) {
    return {
      ...content.remoteAttachment,
      contentLength: content.remoteAttachment.contentLength ?? "0",
    }
  }

  // Handle multi remote attachments
  if (content.multiRemoteAttachment) {
    return content.multiRemoteAttachment
  }

  // Handle static attachments
  if (content.attachment) {
    return content.attachment
  }

  // Handle text content
  if (content.text !== undefined) {
    return { text: content.text ?? "" }
  }

  // Handle nested reply content
  if (content.reply) {
    return {
      reference: content.reply.reference as unknown as IXmtpMessageId,
      content: convertXmtpReplyContentToConvosContent(content.reply.content),
    }
  }

  // Handle reaction content
  if (content.reaction || content.reactionV2) {
    const reactionContent = content.reaction || content.reactionV2
    if (reactionContent) {
      return {
        reference: reactionContent.reference as unknown as IXmtpMessageId,
        action: reactionContent.action ?? "unknown",
        schema: reactionContent.schema ?? "unknown",
        content: reactionContent.content ?? "",
      }
    }
  }

  // Handle group updates
  if (content.groupUpdated) {
    return {
      initiatedByInboxId: content.groupUpdated.initiatedByInboxId as unknown as IXmtpInboxId,
      membersAdded: content.groupUpdated.membersAdded.map((member) => ({
        inboxId: member.inboxId as unknown as IXmtpInboxId,
      })),
      membersRemoved: content.groupUpdated.membersRemoved.map((member) => ({
        inboxId: member.inboxId as unknown as IXmtpInboxId,
      })),
      metadataFieldsChanged: content.groupUpdated.metadataFieldsChanged || [],
    }
  }

  // Default to empty text if no recognizable content
  return { text: "" }
}
