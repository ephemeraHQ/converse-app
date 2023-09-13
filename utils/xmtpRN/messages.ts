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
  let referencedMessageId: string | undefined = undefined;
  let content = message.content.text || "";
  if (message.content.remoteAttachment) {
    content = computeRemoteAttachmentMessageContent(
      message.content.remoteAttachment
    );
  } else if (message.content.attachment) {
    content = JSON.stringify(message.content.attachment);
  } else if (message.content.reaction) {
    content = JSON.stringify(message.content.reaction);
    referencedMessageId = message.content.reaction.reference;
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
    topic: message.topic,
  };
};

export const streamAllMessages = async (client: Client) => {
  await stopStreamingAllMessage(client);
  client.conversations.streamAllMessages(async (message) => {
    saveMessages(client.address, [protocolMessageToStateMessage(message)]);
  });
};

export const stopStreamingAllMessage = async (client: Client) =>
  client.conversations.cancelStreamAllMessages();

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
      if (m.sent > queryConversationsFromTimestamp[m.topic]) {
        queryConversationsFromTimestamp[m.topic] = m.sent;
      }
    });

    topicsToQuery.forEach((topic) => {
      const messages = messagesByTopic[topic];
      if (!messages || messages.length <= 1) {
        // When we have no more messages for a topic it means we have gone through all of it
        // Checking if messages.length < BATCH_QUERY_PAGE_SIZE would be more performant (one less query
        // per topic) but could miss messages because if there are messages that are not decoded they
        // are not returned by listBatchMessages)
        delete queryConversationsFromTimestamp[topic];
      }
    });

    messagesBatch.sort((messageA, messageB) => messageA.sent - messageB.sent);
    saveMessages(
      client.address,
      messagesBatch.map(protocolMessageToStateMessage)
    );
  }
};
