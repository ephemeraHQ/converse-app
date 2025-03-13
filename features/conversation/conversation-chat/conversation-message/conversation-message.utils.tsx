import {
  MessageDeliveryStatus,
  ReactionContent,
  RemoteAttachmentContent,
  ReplyContent,
  StaticAttachmentContent,
} from "@xmtp/react-native-sdk"
import emojiRegex from "emoji-regex"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  IConversationMessage,
  IConversationMessageContent,
  IConversationMessageContentType,
  IConversationMessageId,

  IConversationMessageGroupUpdated,
  IConversationMessageMultiRemoteAttachmentContent,
  IConversationMessageReaction,
  IConversationMessageRemoteAttachment,
  IConversationMessageReply,
  IConversationMessageStaticAttachment,
  IConversationMessageText} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import {
  getConversationMessagesQueryData,
  useConversationMessagesQuery,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import {
  getXmtpMessageContentType,
  isXmtpGroupUpdatedContent,
  isXmtpMultiRemoteAttachmentContent,
  isXmtpReactionContent,
  isXmtpReadReceiptContent,
  isXmtpRemoteAttachmentContent,
  isXmtpReplyContent,
  isXmtpStaticAttachmentContent,
  isXmtpTextContent,
} from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
import { IXmtpDecodedMessage, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { IConversationTopic } from "../../conversation.types"
import { useCurrentConversationTopicSafe } from "../conversation.store-context"

export function isAnActualMessage(message: IConversationMessage): message is IConversationMessage {
  return !isReadReceiptMessage(message) && !isGroupUpdatedMessage(message)
}

export function isTextMessage(message: IConversationMessage): message is IConversationMessageText {
  return getXmtpMessageContentType({ message }) === "text"
}

export function isReactionMessage(
  message: IConversationMessage,
): message is IConversationMessageReaction {
  return getXmtpMessageContentType({ message }) === "reaction"
}

export function isReadReceiptMessage(message: IConversationMessage) {
  // return getMessageContentType({message}) === "readReceipt";
  // TODO
  return false
}

export function isGroupUpdatedMessage(
  message: IConversationMessage,
): message is IConversationMessageGroupUpdated {
  return getXmtpMessageContentType({ message }) === "groupUpdated"
}

export function isReplyMessage(
  message: IConversationMessage,
): message is IConversationMessageReply {
  return getXmtpMessageContentType({ message }) === "reply"
}

export function isRemoteAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageRemoteAttachment {
  return getXmtpMessageContentType({ message }) === "remoteAttachment"
}

export function isStaticAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageStaticAttachment {
  return getXmtpMessageContentType({ message }) === "attachment"
}

export function isMultiRemoteAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageMultiRemoteAttachmentContent {
  return getXmtpMessageContentType({ message }) === "multiRemoteAttachment"
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
  const content = message.content()

  if (typeof content === "string") {
    return content
  }

  if (isTextMessage(message)) {
    return message.content() as string
  }

  if (isRemoteAttachmentMessage(message)) {
    const content = message.content() as RemoteAttachmentContent
    return content.url
  }

  if (isStaticAttachmentMessage(message)) {
    const content = message.content() as StaticAttachmentContent
    return content.filename
  }

  if (isReactionMessage(message)) {
    const content = message.content() as ReactionContent
    return content.content || ""
  }

  if (isReplyMessage(message)) {
    const content = message.content() as ReplyContent
    if (content.content.text) {
      return content.content.text
    }

    if (content.content.reply?.content.text) {
      return content.content.reply.content.text
    }

    if (content.content.attachment?.filename) {
      return content.content.attachment.filename
    }

    if (content.content.remoteAttachment?.url) {
      return content.content.remoteAttachment.url
    }

    if (content.content.groupUpdated) {
      return "Group updated"
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

export function getConvosMessageStatusForXmtpMessage(message: IXmtpDecodedMessage) {
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
  return {
    id: message.id as unknown as IConversationMessageId,
    status: getConvosMessageStatusForXmtpMessage(message),
    senderInboxId: message.senderInboxId as unknown as IXmtpInboxId,
    sentNs: message.sentNs,
    type: getMessageTypeForXmtpMessage({ message }),
    content: message.nativeContent as IConversationMessageContent,
  }
}

export function getMessageTypeForXmtpMessage(args: {
  message: IXmtpDecodedMessage
}): IConversationMessageContentType {
  const { message } = args

  if (isXmtpTextContent(message.contentTypeId)) {
    return "text"
  }

  if (isXmtpRemoteAttachmentContent(message.contentTypeId)) {
    return "remoteAttachment"
  }

  if (isXmtpStaticAttachmentContent(message.contentTypeId)) {
    return "staticAttachment"
  }

  if (isXmtpReactionContent(message.contentTypeId)) {
    return "reaction"
  }

  if (isXmtpReplyContent(message.contentTypeId)) {
    return "reply"
  }

  if (isXmtpReadReceiptContent(message.contentTypeId)) {
    return "readReceipt"
  }

  if (isXmtpGroupUpdatedContent(message.contentTypeId)) {
    return "groupUpdated"
  }

  if (isXmtpMultiRemoteAttachmentContent(message.contentTypeId)) {
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
