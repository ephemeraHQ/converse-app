import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import {
  getMessageContentType,
  isContentType,
} from "@/utils/xmtpRN/xmtp-content-types/xmtp-content-types";
import type { ReactionContent } from "@xmtp/react-native-sdk";

type GetNotificationContentArgs = {
  message: DecodedMessageWithCodecsType;
  account: string;
};

export const getNotificationContent = async (
  args: GetNotificationContentArgs
) => {
  const { message, account } = args;

  const supportedContentType = !!getMessageContentType(message.contentTypeId);
  if (!supportedContentType) return;

  const contentType = message.contentTypeId;
  const messageContent = message.content();

  if (isContentType({ type: "reply", contentType })) {
    // @todo => implement replies when https://github.com/xmtp/xmtp-node-go/issues/409 is done
    return "REPLY";
  }

  if (isContentType({ type: "text", contentType })) {
    return messageContent as string;
  }

  if (isContentType({ type: "remoteAttachment", contentType })) {
    return "📎 Media";
  }

  if (isContentType({ type: "transactionReference", contentType })) {
    return "💸 Transaction";
  }

  // For reactions, we need to check if the message is from the current account
  if (isContentType({ type: "reaction", contentType })) {
    const {
      action,
      // reference: messageIdAssociatedWithReaction,
      schema,
      content,
    } = messageContent as ReactionContent;

    if (action === "added" && schema === "unicode") {
      // If the message is from the current account, we don't need to show the notification
      // TODO: This check was there before but not sure if it's needed because we still want to show the notification
      //  if someone else reacted to a message from the current account?
      // const message = await getOrFetchConversationMessageQuery({
      //   messageId: messageIdAssociatedWithReaction as MessageId,
      //   account,
      // });

      // if (!message) {
      //   throw new Error("Message referenced for reaction not found");
      // }

      // if (await isMessageFromEthAddress({ message, ethAddress: account })) {
      //   return;
      // }

      return content
        ? `Reacted ${content} to a message`
        : "Reacted to a message";
    }
  }

  if (isContentType({ type: "readReceipt", contentType })) {
    return;
  }
};
