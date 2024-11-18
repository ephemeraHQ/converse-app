import logger from "@utils/logger";

import { ConverseXmtpClientType } from "./client";
import { getXmtpClient } from "./sync";

import config from "../../config";

import { addConversationMessage } from "@queries/useConversationMessages";
import { updateMessageToConversationListQuery } from "@queries/useV3ConversationListQuery";
import { handleGroupUpdatedMessage } from "@data/helpers/messages/handleGroupUpdatedMessage";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

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
    addConversationMessage(
      client.address,
      message.topic as ConversationTopic,
      message
    );
    updateMessageToConversationListQuery(client.address, message);
    return;
  });
};

export const stopStreamingAllMessage = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  logger.debug(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  client.conversations.cancelStreamAllMessages();
};

export const getUrlToRender = (url: string) => {
  const fullUrl = new URL(url);
  return fullUrl.hostname;
};
