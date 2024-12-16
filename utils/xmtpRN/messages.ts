import logger from "@utils/logger";
import { ConverseXmtpClientType } from "./client";
import { getXmtpClient } from "./sync";
import config from "../../config";
import { updateMessageToConversationListQuery } from "@/queries/useV3ConversationListQuery";
import { handleGroupUpdatedMessage } from "@data/helpers/messages/handleGroupUpdatedMessage";
import { addConversationMessage } from "@queries/useConversationMessages";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import {
  messageIsFromCurrentUser,
  messageIsFromCurrentUserV3,
} from "@/features/conversation/utils/message-is-from-current-user";
import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";

export const streamAllMessages = async (account: string) => {
  await stopStreamingAllMessage(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  logger.info(`[XmtpRN] Streaming messages for ${client.address}`);
  await client.conversations.streamAllMessages(async (message) => {
    logger.info(`[XmtpRN] Received a message for ${client.address}`, {
      id: message.id,
      text: config.env === "prod" ? "Redacted" : message.nativeContent.text,
      topic: message.topic,
    });
    if (message.contentTypeId.includes("group_updated")) {
      handleGroupUpdatedMessage(
        client.address,
        message.topic as ConversationTopic,
        message
      );
    }

    // We already handle text messages from the current user locally via react-query
    // We only need to handle messages that are either:
    // 1. From other users
    // 2. Non-text messages from current user
    const isMessageFromOtherUser = !messageIsFromCurrentUserV3({ message });
    const isNonTextMessage = !isTextMessage(message);
    if (isMessageFromOtherUser || isNonTextMessage) {
      addConversationMessage({
        account: client.address,
        topic: message.topic as ConversationTopic,
        message,
      });
    }

    updateMessageToConversationListQuery(client.address, message);
    return;
  });
};

export const stopStreamingAllMessage = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  logger.debug(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  await client.conversations.cancelStreamAllMessages();
};

export const getUrlToRender = (url: string) => {
  const fullUrl = new URL(url);
  return fullUrl.hostname;
};
