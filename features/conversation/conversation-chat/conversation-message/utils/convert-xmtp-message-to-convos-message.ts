import { MessageDeliveryStatus } from "@xmtp/react-native-sdk"
import {
  IConversationMessage,
  IConversationMessageContent,
  IConversationMessageGroupUpdated,
  IConversationMessageId,
  IConversationMessageReaction,
  IConversationMessageReply,
  IConversationMessageStatus,
  IConversationMessageText,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import {
  getXmtpMessageIsGroupUpdatedMessage,
  getXmtpMessageIsMultiRemoteAttachmentMessage,
  getXmtpMessageIsReactionMessage,
  getXmtpMessageIsRemoteAttachmentMessage,
  getXmtpMessageIsReplyMessage,
  getXmtpMessageIsStaticAttachmentMessage,
  getXmtpMessageIsTextMessage,
} from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { IXmtpDecodedMessage, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function convertXmtpMessageToConvosMessage(
  message: IXmtpDecodedMessage,
): IConversationMessage {
  const baseMessage = {
    id: message.id as unknown as IConversationMessageId,
    topic: message.topic as unknown as IConversationTopic,
    status: getConvosMessageStatusForXmtpMessage(message),
    senderInboxId: message.senderInboxId as unknown as IXmtpInboxId,
    sentNs: message.sentNs,
  }

  // Handle fallback case
  if (!message.nativeContent) {
    const textMessage: IConversationMessageText = {
      ...baseMessage,
      type: "text",
      content: { text: message.fallback ?? "" },
    }
    return textMessage
  }

  // Use type-checking functions to determine message type and create appropriate message
  if (getXmtpMessageIsTextMessage(message)) {
    const textContent = message.content()
    return {
      ...baseMessage,
      type: "text",
      content: {
        text: textContent ?? "",
      },
    } satisfies IConversationMessageText
  }

  if (getXmtpMessageIsReactionMessage(message)) {
    const reactionContent = message.content()
    return {
      ...baseMessage,
      type: "reaction",
      content: {
        reference: reactionContent.reference as unknown as IConversationMessageId,
        action: reactionContent.action ?? "unknown",
        schema: reactionContent.schema ?? "unknown",
        content: reactionContent.content ?? "",
      },
    } satisfies IConversationMessageReaction
  }

  if (getXmtpMessageIsReplyMessage(message)) {
    const replyContent = message.content()
    return {
      ...baseMessage,
      type: "reply",
      content: {
        reference: replyContent.reference as unknown as IConversationMessageId,
        // Don't like doing the "as" but reply is complex... Let's fix this later
        content: replyContent.content as IConversationMessageContent,
      },
    } satisfies IConversationMessageReply
  }

  if (getXmtpMessageIsGroupUpdatedMessage(message)) {
    const groupUpdatedContent = message.content()
    return {
      ...baseMessage,
      type: "groupUpdated",
      content: {
        initiatedByInboxId: groupUpdatedContent.initiatedByInboxId as unknown as IXmtpInboxId,
        membersAdded: groupUpdatedContent.membersAdded.map((member) => ({
          inboxId: member.inboxId as unknown as IXmtpInboxId,
        })),
        membersRemoved: groupUpdatedContent.membersRemoved.map((member) => ({
          inboxId: member.inboxId as unknown as IXmtpInboxId,
        })),
        metadataFieldsChanged: groupUpdatedContent.metadataFieldsChanged,
      },
    } satisfies IConversationMessageGroupUpdated
  }

  if (getXmtpMessageIsRemoteAttachmentMessage(message)) {
    const remoteAttachmentContent = message.content()
    return {
      ...baseMessage,
      type: "remoteAttachment",
      content: {
        ...remoteAttachmentContent,
        contentLength: remoteAttachmentContent.contentLength ?? "0",
      },
    }
  }

  if (getXmtpMessageIsStaticAttachmentMessage(message)) {
    const staticAttachmentContent = message.content()
    return {
      ...baseMessage,
      type: "staticAttachment",
      content: staticAttachmentContent,
    }
  }

  if (getXmtpMessageIsMultiRemoteAttachmentMessage(message)) {
    const multiRemoteAttachmentContent = message.content()
    return {
      ...baseMessage,
      type: "multiRemoteAttachment",
      content: multiRemoteAttachmentContent,
    }
  }

  const _exhaustiveCheck: never = message
  throw new Error(`Unhandled message type to convert from XMTP to ConvoMessage`)
}
export function getConvosMessageStatusForXmtpMessage(
  message: IXmtpDecodedMessage,
): IConversationMessageStatus {
  // @ts-ignore - Custom for optimistic message, we might want to have our custom ConvoMessage
  if (message.deliveryStatus === "sending") {
    return "sending"
  }

  switch (message.deliveryStatus) {
    case MessageDeliveryStatus.UNPUBLISHED:
    case MessageDeliveryStatus.FAILED:
      return "error"
    case MessageDeliveryStatus.PUBLISHED:
    case MessageDeliveryStatus.ALL:
      return "sent"
    default:
      throw new Error(`Unhandled delivery status: ${message.deliveryStatus}`)
  }
}
