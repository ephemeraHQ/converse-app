import {
  Client,
  DecodedMessage,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";

import { addLog } from "../../components/DebugButton";
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
  console.log(`[XmtpRN] Streaming messages for ${client.address}`);
  client.conversations.streamAllMessages(async (message) => {
    console.log(`[XmtpRN] Received a message for ${client.address}`);
    saveMessages(client.address, [protocolMessageToStateMessage(message)]);
  });
};

export const stopStreamingAllMessage = (client: Client) => {
  console.log(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  client.conversations.cancelStreamAllMessages();
};

export const loadConversationsMessages = async (
  client: Client,
  _queryConversationsFromTimestamp: { [topic: string]: number }
): Promise<number> => {
  const queryConversationsFromTimestamp = {
    ..._queryConversationsFromTimestamp,
  };
  let messagesFetched = 0;

  while (Object.keys(queryConversationsFromTimestamp).length > 0) {
    const topicsToQuery = Object.keys(queryConversationsFromTimestamp);
    const messagesBatch = await client.listBatchMessages(
      topicsToQuery.map((topic) => ({
        contentTopic: topic,
        startTime: new Date(queryConversationsFromTimestamp[topic]),
        pageSize: BATCH_QUERY_PAGE_SIZE,
        direction: "SORT_DIRECTION_ASCENDING",
      }))
    );
    console.log(
      `[XmtpRn] Fetched ${messagesBatch.length} messages from network for ${client.address}`
    );

    const oldQueryConversationsFromTimestamp = {
      ...queryConversationsFromTimestamp,
    };

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

    // To avoid a loop let's verify that we don't query a topic
    // again with the exact same timestamp
    Object.keys(queryConversationsFromTimestamp).forEach((topic) => {
      if (
        queryConversationsFromTimestamp[topic] ===
        oldQueryConversationsFromTimestamp[topic]
      ) {
        console.log(
          "[XmtpRn] Avoiding a loop during sync due to weird timestamps"
        );
        addLog(`Avoiding a loop`);
        queryConversationsFromTimestamp[topic] += 1;
      }
    });

    messagesBatch.sort((messageA, messageB) => messageA.sent - messageB.sent);
    messagesFetched += messagesBatch.length;
    saveMessages(
      client.address,
      messagesBatch.map(protocolMessageToStateMessage)
    );
  }
  addLog(`Fetched ${messagesFetched} messages from network`);
  return messagesFetched;
};
