import { getConversationMessageQueryOptions } from "@/queries/useConversationMessage";
import {
  getConversationMessages,
  useConversationMessages,
} from "@/queries/useConversationMessages";
import {
  DecodedMessageWithCodecsType,
  SupportedCodecsType,
} from "@/utils/xmtpRN/client.types";
import { CoinbaseMessagingPaymentCodec } from "@/utils/xmtpRN/content-types/coinbasePayment";
import { getMessageContentType } from "@/utils/xmtpRN/content-types/content-types";
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { getReadableProfile } from "@utils/getReadableProfile";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  ConversationTopic,
  DecodedMessage,
  GroupUpdatedCodec,
  MessageDeliveryStatus,
  MessageId,
  ReactionCodec,
  ReactionContent,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
  ReplyCodec,
  ReplyContent,
  StaticAttachmentCodec,
  StaticAttachmentContent,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { useCurrentConversationTopic } from "../conversation.store-context";

export function isAnActualMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<TextCodec> {
  return !isReadReceiptMessage(message) && !isGroupUpdatedMessage(message);
}

export function isTextMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<TextCodec> {
  return getMessageContentType(message.contentTypeId) === "text";
}
export function isReactionMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<ReactionCodec> {
  return getMessageContentType(message.contentTypeId) === "reaction";
}
export function isReadReceiptMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<ReadReceiptCodec> {
  return getMessageContentType(message.contentTypeId) === "readReceipt";
}
export function isGroupUpdatedMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<GroupUpdatedCodec> {
  return getMessageContentType(message.contentTypeId) === "groupUpdated";
}
export function isReplyMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<ReplyCodec> {
  return getMessageContentType(message.contentTypeId) === "reply";
}
export function isRemoteAttachmentMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<RemoteAttachmentCodec> {
  return getMessageContentType(message.contentTypeId) === "remoteAttachment";
}
export function isStaticAttachmentMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<StaticAttachmentCodec> {
  return getMessageContentType(message.contentTypeId) === "attachment";
}
export function isTransactionReferenceMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<TransactionReferenceCodec, SupportedCodecsType> {
  return (
    getMessageContentType(message.contentTypeId) === "transactionReference"
  );
}
export function isCoinbasePaymentMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<CoinbaseMessagingPaymentCodec> {
  return getMessageContentType(message.contentTypeId) === "coinbasePayment";
}

export function useMessageSenderReadableProfile(
  message: DecodedMessageWithCodecsType
) {
  const currentAccountAdress = useCurrentAccount();
  if (!currentAccountAdress) {
    return "";
  }
  return getReadableProfile(currentAccountAdress, message.senderInboxId);
}

export function getMessageById({
  messageId,
  topic,
}: {
  messageId: MessageId;
  topic: ConversationTopic;
}) {
  const currentAccount = getCurrentAccount()!;
  const messages = getConversationMessages(currentAccount, topic);
  if (!messages) {
    return null;
  }
  return messages.byId[messageId];
}

export function getMessageStringContent(
  message: DecodedMessageWithCodecsType
): string | undefined {
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

  if (isTransactionReferenceMessage(message)) {
    return "Transaction";
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

  if (isCoinbasePaymentMessage(message)) {
    return "Coinbase payment";
  }

  return "";
}

export function useConversationMessageById({
  messageId,
  topic,
}: {
  messageId: MessageId;
  topic: ConversationTopic;
}) {
  const currentAccount = useCurrentAccount()!;
  const { data: messages } = useConversationMessages(currentAccount, topic);

  const cachedMessage = messages?.byId[messageId];

  // Only fetch the message if it's not already in the conversation messages
  const { data: message, isLoading: isLoadingMessage } = useQuery({
    ...getConversationMessageQueryOptions({
      account: currentAccount,
      messageId,
    }),
    enabled: !cachedMessage,
  });

  return {
    message: message ?? cachedMessage,
    isLoading: !cachedMessage && isLoadingMessage,
  };
}

export function useConversationMessageReactions(messageId: MessageId) {
  const currentAccount = useCurrentAccount()!;
  const topic = useCurrentConversationTopic();

  const { data: messages } = useConversationMessages(currentAccount, topic);

  // TODO: Add another fallback query to fetch single message reactions. Coming in the SDK later

  return {
    bySender: messages?.reactions[messageId]?.bySender,
    byReactionContent: messages?.reactions[messageId]?.byReactionContent,
  };
}

export function getConvosMessageStatus(message: DecodedMessageWithCodecsType) {
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
