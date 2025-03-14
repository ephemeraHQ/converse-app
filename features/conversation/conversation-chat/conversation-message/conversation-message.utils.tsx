import { MessageDeliveryStatus } from "@xmtp/react-native-sdk"
import emojiRegex from "emoji-regex"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  IConversationMessage,
  IConversationMessageContent,
  IConversationMessageContentType,
  IConversationMessageGroupUpdated,
  IConversationMessageGroupUpdatedContent,
  IConversationMessageId,
  IConversationMessageMultiRemoteAttachment,
  IConversationMessageMultiRemoteAttachmentContent,
  IConversationMessageReaction,
  IConversationMessageReactionContent,
  IConversationMessageRemoteAttachment,
  IConversationMessageRemoteAttachmentContent,
  IConversationMessageReply,
  IConversationMessageReplyContent,
  IConversationMessageStaticAttachment,
  IConversationMessageStaticAttachmentContent,
  IConversationMessageStatus,
  IConversationMessageText,
  IConversationMessageTextContent,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import {
  getConversationMessagesQueryData,
  useConversationMessagesQuery,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import {
  isXmtpGroupUpdatedContentType,
  isXmtpMultiRemoteAttachmentContentType,
  isXmtpReactionContentType,
  isXmtpRemoteAttachmentContentType,
  isXmtpReplyContentType,
  isXmtpStaticAttachmentContentType,
  isXmtpTextContentType,
} from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
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
import { IConversationTopic } from "../../conversation.types"
import { useCurrentConversationTopicSafe } from "../conversation.store-context"

export function isAnActualMessage(message: IConversationMessage): message is IConversationMessage {
  return !isReadReceiptMessage(message) && !isGroupUpdatedMessage(message)
}

export function isTextMessage(message: IConversationMessage): message is IConversationMessageText {
  return message.type === "text"
}

export function isReactionMessage(
  message: IConversationMessage,
): message is IConversationMessageReaction {
  return message.type === "reaction"
}

export function isReadReceiptMessage(message: IConversationMessage) {
  // TODO
  return false
}

export function isGroupUpdatedMessage(
  message: IConversationMessage,
): message is IConversationMessageGroupUpdated {
  return message.type === "groupUpdated"
}

export function isReplyMessage(
  message: IConversationMessage,
): message is IConversationMessageReply {
  return message.type === "reply"
}

export function isRemoteAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageRemoteAttachment {
  return message.type === "remoteAttachment"
}

export function isStaticAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageStaticAttachment {
  return message.type === "staticAttachment"
}

export function isMultiRemoteAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageMultiRemoteAttachment {
  return message.type === "multiRemoteAttachment"
}

export function getMessageById({
  messageId,
  topic,
}: {
  messageId: IConversationMessageId
  topic: IConversationTopic
}) {
  const currentSender = getSafeCurrentSender()
  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    topic,
  })
  if (!messages) {
    return null
  }
  return messages.byId[messageId]
}

export function getMessageStringContent(message: IConversationMessage) {
  const content = message.content

  if (typeof content === "string") {
    return content
  }

  if (isTextMessage(message)) {
    return message.content.text
  }

  if (isRemoteAttachmentMessage(message)) {
    return message.content.url
  }

  if (isStaticAttachmentMessage(message)) {
    return message.content.filename
  }

  if (isReactionMessage(message)) {
    return message.content.content
  }

  if (isReplyMessage(message)) {
    const replyContent = message.content
    if (messageContentIsText(replyContent)) {
      return replyContent.text
    }

    if (messageContentIsRemoteAttachment(replyContent)) {
      return replyContent.url
    }

    if (messageContentIsStaticAttachment(replyContent)) {
      return replyContent.filename
    }

    if (messageContentIsGroupUpdated(replyContent)) {
      return "Group updated"
    }

    if (messageContentIsRemoteAttachment(replyContent)) {
      return replyContent.url
    }

    if (messageContentisMultiRemoteAttachment(replyContent)) {
      return "Multi remote attachment"
    }

    return ""
  }

  if (isGroupUpdatedMessage(message)) {
    return "Group updated"
  }

  return ""
}

export function useMessageHasReactions(args: { messageId: IConversationMessageId }) {
  const { messageId } = args
  const reactions = useConversationMessageReactions(messageId)
  return Object.values(reactions.bySender || {}).some((reactions) => reactions.length > 0)
}

export function useConversationMessageReactions(messageId: IConversationMessageId) {
  const currentSender = getSafeCurrentSender()
  const topic = useCurrentConversationTopicSafe()

  const { data: messages } = useConversationMessagesQuery({
    clientInboxId: currentSender.inboxId,
    topic,
    caller: "useConversationMessageReactions",
  })

  // TODO: Add another fallback query to fetch single message reactions. Coming in the SDK later

  return {
    bySender: messages?.reactions[messageId]?.bySender,
    byReactionContent: messages?.reactions[messageId]?.byReactionContent,
  }
}

export function getCurrentUserAlreadyReactedOnMessage(args: {
  messageId: IConversationMessageId
  topic: IConversationTopic
  emoji: string | undefined // Specific emoji or just reacted in general
}) {
  const { messageId, topic, emoji } = args
  const currentSender = getSafeCurrentSender()
  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    topic,
  })
  const reactions = messages?.reactions[messageId]
  const bySender = reactions?.bySender
  return bySender?.[currentSender.inboxId!]?.some(
    (reaction) => !emoji || reaction.content === emoji,
  )
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

// Compile emoji regex once
const compiledEmojiRegex = emojiRegex()

export const shouldRenderBigEmoji = (text: string) => {
  const trimmedContent = text.trim()
  const emojis = trimmedContent.match(compiledEmojiRegex) || []

  const hasEmojis = emojis.length > 0
  const hasFewerThanFourEmojis = emojis.length < 4
  const containsOnlyEmojis = emojis.join("") === trimmedContent

  return hasEmojis && hasFewerThanFourEmojis && containsOnlyEmojis
}

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
      content: remoteAttachmentContent,
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

export function getMessageTypeForXmtpMessage(args: {
  message: IXmtpDecodedMessage
}): IConversationMessageContentType {
  const { message } = args

  if (isXmtpTextContentType(message.contentTypeId)) {
    return "text"
  }

  if (isXmtpRemoteAttachmentContentType(message.contentTypeId)) {
    return "remoteAttachment"
  }

  if (isXmtpStaticAttachmentContentType(message.contentTypeId)) {
    return "staticAttachment"
  }

  if (isXmtpReactionContentType(message.contentTypeId)) {
    return "reaction"
  }

  if (isXmtpReplyContentType(message.contentTypeId)) {
    return "reply"
  }

  if (isXmtpGroupUpdatedContentType(message.contentTypeId)) {
    return "groupUpdated"
  }

  if (isXmtpMultiRemoteAttachmentContentType(message.contentTypeId)) {
    return "multiRemoteAttachment"
  }

  throw new Error(`Unhandled message type: ${message.contentTypeId}`)
}

export function getConversationPreviousMessage(args: {
  messageId: IConversationMessageId
  topic: IConversationTopic
}) {
  const { messageId, topic } = args
  const currentSender = getSafeCurrentSender()
  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    topic,
  })
  if (!messages?.ids.includes(messageId)) {
    return undefined
  }
  const currentIndex = messages.ids.indexOf(messageId)
  const nextMessageId = messages.ids[currentIndex + 1]
  return nextMessageId ? messages.byId[nextMessageId] : undefined
}

export function getConversationNextMessage(args: {
  messageId: IConversationMessageId
  topic: IConversationTopic
}) {
  const { messageId, topic } = args
  const currentSender = getSafeCurrentSender()
  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    topic,
  })
  if (!messages?.ids.includes(messageId)) {
    return undefined
  }
  const currentIndex = messages.ids.indexOf(messageId)
  const previousMessageId = messages.ids[currentIndex - 1]
  return previousMessageId ? messages.byId[previousMessageId] : undefined
}

export function messageContentIsStaticAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageStaticAttachmentContent {
  return "attachment" in content
}

export function messageContentIsText(
  content: IConversationMessageContent,
): content is IConversationMessageTextContent {
  return "text" in content
}

export function messageContentIsRemoteAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageRemoteAttachmentContent {
  return "secret" in content && "url" in content
}

export function messageContentisMultiRemoteAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageMultiRemoteAttachmentContent {
  return "multiRemoteAttachment" in content
}

export function messageContentIsReaction(
  content: IConversationMessageContent,
): content is IConversationMessageReactionContent {
  return "reaction" in content
}

export function messageContentIsGroupUpdated(
  content: IConversationMessageContent,
): content is IConversationMessageGroupUpdatedContent {
  return "groupUpdated" in content
}

export function messageContentIsReply(
  content: IConversationMessageContent,
): content is IConversationMessageReplyContent {
  return "reply" in content
}
