import {
  Client,
  Conversation,
  DecodedMessage,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";

import { saveMessages } from "../../data/helpers/messages";
import { XmtpMessage } from "../../data/store/chatStore";

const BATCH_QUERY_PAGE_SIZE = 30;

const computeRemoteAttachmentMessageContent = (
  content: RemoteAttachmentContent
) => {
  const contentLength = content.contentLength
    ? parseInt(content.contentLength, 10)
    : undefined;
  return JSON.stringify({
    ...content,
    contentLength,
    salt: Buffer.from(content.salt, "hex").toString("base64"),
    nonce: Buffer.from(content.nonce, "hex").toString("base64"),
    secret: Buffer.from(content.secret, "hex").toString("base64"),
  });
};

const protocolMessageToStateMessage = (
  message: DecodedMessage
): XmtpMessage => {
  const referencedMessageId = undefined; // TODO => handle referenced if reaction
  let content = message.content.text || "";
  if (message.content.remoteAttachment) {
    content = computeRemoteAttachmentMessageContent(
      message.content.remoteAttachment
    );
  } else if (message.content.attachment) {
    content = JSON.stringify(message.content.attachment);
  } else if (message.content.reaction) {
    content = JSON.stringify(message.content.reaction);
  }
  return {
    id: message.id,
    senderAddress: message.senderAddress,
    sent: message.sent,
    contentType: message.contentTypeId,
    status: "delivered",
    sentViaConverse: message.sentViaConverse || false,
    content,
    referencedMessageId,
  };
};

export const streamAllMessages = async (client: Client) => {
  client.conversations.streamAllMessages(async (message) => {
    saveMessages(
      client.address,
      [protocolMessageToStateMessage(message)],
      message.topic
    );
  });
};

export const loadConversationsMessages = async (
  client: Client,
  conversations: Conversation[],
  lastTimestamp?: number
) => {
  const queryConversationsFromTimestamp: { [topic: string]: number } = {};
  conversations.forEach((c) => {
    queryConversationsFromTimestamp[c.topic] = lastTimestamp || 0;
  });
  while (Object.keys(queryConversationsFromTimestamp).length > 0) {
    const topicsToQuery = Object.keys(queryConversationsFromTimestamp);
    const messagesBatch = await client.listBatchMessages(
      topicsToQuery.map((topic) => ({
        contentTopic: topic,
        startTime: new Date(queryConversationsFromTimestamp[topic]),
        pageSize: BATCH_QUERY_PAGE_SIZE,
      }))
    );
    console.log(
      `[XmtpRn] Fetched ${messagesBatch.length} messages from network`
    );

    const messagesByTopic: { [topic: string]: DecodedMessage[] } = {};
    messagesBatch.forEach((m) => {
      messagesByTopic[m.topic] = messagesByTopic[m.topic] || [];
      messagesByTopic[m.topic].push(m);
    });

    topicsToQuery.forEach((topic) => {
      const messages = messagesByTopic[topic];
      if (!messages || messages.length < BATCH_QUERY_PAGE_SIZE) {
        // Since we get less than BATCH_QUERY_PAGE_SIZE
        // we know that we got everything, no further query
        delete queryConversationsFromTimestamp[topic];
      }
    });

    Object.keys(messagesByTopic).forEach((topic) => {
      messagesByTopic[topic].sort(
        (messageA, messageB) => messageA.sent - messageB.sent
      );
      messagesByTopic[topic].map(protocolMessageToStateMessage);
      saveMessages(
        client.address,
        messagesByTopic[topic].map(protocolMessageToStateMessage),
        topic
      );
    });
  }
};
