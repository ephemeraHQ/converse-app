import {
  ConversationTopic,
  MessageDeliveryStatus,
  MessageId,
  ReactionContent,
  RemoteAttachmentContent,
  ReplyContent,
  StaticAttachmentContent,
} from "@xmtp/react-native-sdk";
import emojiRegex from "emoji-regex";
import {
  getCurrentSenderEthAddress,
  getSafeCurrentSender,
  useCurrentSenderEthAddress,
} from "@/features/authentication/multi-inbox.store";
import {
  getConversationMessagesQueryData,
  useConversationMessagesQuery,
} from "@/features/conversation/conversation-messages.query";
import { getMessageContentType } from "@/features/xmtp/xmtp-content-types/xmtp-content-types";
import {
  IXmtpDecodedActualMessage,
  IXmtpDecodedGroupUpdatedMessage,
  IXmtpDecodedMessage,
  IXmtpDecodedReactionMessage,
  IXmtpDecodedRemoteAttachmentMessage,
  IXmtpDecodedReplyMessage,
  IXmtpDecodedStaticAttachmentMessage,
  IXmtpDecodedTextMessage,
} from "@/features/xmtp/xmtp.types";
import { useCurrentConversationTopicSafe } from "../conversation.store-context";

export function isAnActualMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedActualMessage {
  return !isReadReceiptMessage(message) && !isGroupUpdatedMessage(message);
}

export function isTextMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedTextMessage {
  return getMessageContentType({ message }) === "text";
}

export function isReactionMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedReactionMessage {
  return getMessageContentType({ message }) === "reaction";
}

export function isReadReceiptMessage(message: IXmtpDecodedMessage) {
  // return getMessageContentType({message}) === "readReceipt";
  // TODO
  return false;
}

export function isGroupUpdatedMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedGroupUpdatedMessage {
  return getMessageContentType({ message }) === "groupUpdated";
}

export function isReplyMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedReplyMessage {
  return getMessageContentType({ message }) === "reply";
}

export function isRemoteAttachmentMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedRemoteAttachmentMessage {
  return getMessageContentType({ message }) === "remoteAttachment";
}

export function isStaticAttachmentMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedStaticAttachmentMessage {
  return getMessageContentType({ message }) === "attachment";
}

export function getMessageById({
  messageId,
  topic,
}: {
  messageId: MessageId;
  topic: ConversationTopic;
}) {
  const currentAccount = getCurrentSenderEthAddress()!;
  const messages = getConversationMessagesQueryData({
    account: currentAccount,
    topic,
  });
  if (!messages) {
    return null;
  }
  return messages.byId[messageId];
}

export function getMessageStringContent(message: IXmtpDecodedMessage) {
  const content = message.content();

  if (typeof content === "string") {
    return content;
  }

  if (isTextMessage(message)) {
    return message.content() as string;
  }

  if (isRemoteAttachmentMessage(message)) {
    const content = message.content() as RemoteAttachmentContent;
    return content.url;
  }

  if (isStaticAttachmentMessage(message)) {
    const content = message.content() as StaticAttachmentContent;
    return content.filename;
  }

  if (isReactionMessage(message)) {
    const content = message.content() as ReactionContent;
    return content.content || "";
  }

  if (isReplyMessage(message)) {
    const content = message.content() as ReplyContent;
    if (content.content.text) {
      return content.content.text;
    }

    if (content.content.reply?.content.text) {
      return content.content.reply.content.text;
    }

    if (content.content.attachment?.filename) {
      return content.content.attachment.filename;
    }

    if (content.content.remoteAttachment?.url) {
      return content.content.remoteAttachment.url;
    }

    if (content.content.groupUpdated) {
      return "Group updated";
    }

    return "";
  }

  if (isGroupUpdatedMessage(message)) {
    return "Group updated";
  }

  return "";
}

export function useMessageHasReactions(args: { messageId: MessageId }) {
  const { messageId } = args;
  const reactions = useConversationMessageReactions(messageId);
  return Object.values(reactions.bySender || {}).some(
    (reactions) => reactions.length > 0,
  );
}

export function useConversationMessageReactions(messageId: MessageId) {
  const currentAccount = useCurrentSenderEthAddress()!;
  const topic = useCurrentConversationTopicSafe();

  const { data: messages } = useConversationMessagesQuery({
    account: currentAccount,
    topic,
    caller: "useConversationMessageReactions",
  });

  // TODO: Add another fallback query to fetch single message reactions. Coming in the SDK later

  return {
    bySender: messages?.reactions[messageId]?.bySender,
    byReactionContent: messages?.reactions[messageId]?.byReactionContent,
  };
}

export function getCurrentUserAlreadyReactedOnMessage(args: {
  messageId: MessageId;
  topic: ConversationTopic;
  emoji: string | undefined; // Specific emoji or just reacted in general
}) {
  const { messageId, topic, emoji } = args;
  const currentUserInboxId = getSafeCurrentSender().inboxId;
  const currentAccount = getCurrentSenderEthAddress()!;
  const messages = getConversationMessagesQueryData({
    account: currentAccount,
    topic,
  });
  const reactions = messages?.reactions[messageId];
  const bySender = reactions?.bySender;
  return bySender?.[currentUserInboxId!]?.some(
    (reaction) => !emoji || reaction.content === emoji,
  );
}

export function getConvosMessageStatusForXmtpMessage(
  message: IXmtpDecodedMessage,
) {
  // @ts-ignore - Custom for optimistic message, we might want to have our custom ConvoMessage
  if (message.deliveryStatus === "sending") {
    return "sending";
  }

  switch (message.deliveryStatus) {
    case MessageDeliveryStatus.UNPUBLISHED:
    case MessageDeliveryStatus.FAILED:
      return "error";
    case MessageDeliveryStatus.PUBLISHED:
    case MessageDeliveryStatus.ALL:
      return "sent";
    default:
      throw new Error(`Unhandled delivery status: ${message.deliveryStatus}`);
  }
}

// Compile emoji regex once
const compiledEmojiRegex = emojiRegex();

export const shouldRenderBigEmoji = (text: string) => {
  const trimmedContent = text.trim();
  const emojis = trimmedContent.match(compiledEmojiRegex) || [];

  const hasEmojis = emojis.length > 0;
  const hasFewerThanFourEmojis = emojis.length < 4;
  const containsOnlyEmojis = emojis.join("") === trimmedContent;

  return hasEmojis && hasFewerThanFourEmojis && containsOnlyEmojis;
};

// TODO: for when we want to have our own message type
// export function convertXmtpMessageToConversationMessage(
//   message: DecodedMessageWithCodecsType
// ): IConvosMessage {
//   return {
//     convosMessageId: message.id,
//     xmtpMessageId: message.id,
//     status: getConvosMessageStatusForXmtpMessage(message),
//     senderInboxId: message.senderInboxId,
//     sentNs: message.sentNs,
//     type: getMessageContentType({message}),
//     content: message.content() as NativeMessageContent,
//   };
// }
