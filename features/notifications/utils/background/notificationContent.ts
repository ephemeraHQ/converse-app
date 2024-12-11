import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import {
  getMessageContentType,
  isContentType,
} from "@utils/xmtpRN/contentTypes";
import type {
  MessageId,
  ReactionContent,
  ReplyContent,
} from "@xmtp/react-native-sdk";

export const getNotificationContent = async (
  group: GroupWithCodecsType,
  message: DecodedMessageWithCodecsType
) => {
  const supportedContentType = !!getMessageContentType(message.contentTypeId);
  if (!supportedContentType) return;
  let contentType = message.contentTypeId;
  const messageContent = message.content();
  let referencedMessageId: string | undefined;
  if (isContentType({ type: "reply", contentType })) {
    const replyContent = messageContent as ReplyContent;
    // @todo => implement replies when https://github.com/xmtp/xmtp-node-go/issues/409
    // is done
    // referencedMessageId = replyContent.reference;
    return "REPLY";
  }

  if (isContentType({ type: "text", contentType })) {
    return messageContent as string;
  } else if (isContentType({ type: "remoteAttachment", contentType })) {
    return "📎 Media";
  } else if (isContentType({ type: "transactionReference", contentType })) {
    return "💸 Transaction";
  } else if (isContentType({ type: "reaction", contentType })) {
    let { action, reference, schema, content } =
      messageContent as ReactionContent;
    referencedMessageId = reference;

    if (action === "added" && schema === "unicode") {
      // Checking if the group message is from me
      const isFromMe = await isGroupMessageFromMe(
        group.client,
        referencedMessageId
      );
      if (!isFromMe) return;
      return content
        ? `Reacted ${content} to a message`
        : "Reacted to a message";
    }
  } else if (isContentType({ type: "readReceipt", contentType })) {
    return;
  }
};

const isGroupMessageFromMe = async (
  client: ConverseXmtpClientType,
  messageId: string
) => {
  const message = await client.conversations.findMessage(
    messageId as MessageId
  );
  return message?.senderAddress === client.inboxId;
};
