import {
  DecodedMessage,
  ReactionContent,
  RemoteAttachmentContent,
  StaticAttachmentContent,
} from "@xmtp/react-native-sdk";

import { addLog } from "../../components/DebugButton";
import { saveMessages } from "../../data/helpers/messages";
import { XmtpMessage } from "../../data/store/chatStore";
import { ConverseXmtpClientType, DecodedMessageWithCodecsType } from "./client";
import { isContentType } from "./contentTypes";
// import { CoinbaseMessagingPaymentContent } from "./contentTypes/coinbasePayment";

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
  message: DecodedMessageWithCodecsType
): XmtpMessage => {
  let referencedMessageId: string | undefined = undefined;
  const contentType = message.contentTypeId;
  let content = "";
  let contentFallback: string | undefined = undefined;
  if (isContentType("text", contentType)) {
    content = message.content() as string;
  } else if (isContentType("remoteAttachment", contentType)) {
    content = computeRemoteAttachmentMessageContent(
      message.content() as RemoteAttachmentContent
    );
  } else if (isContentType("attachment", contentType)) {
    content = JSON.stringify(message.content() as StaticAttachmentContent);
  } else if (isContentType("reaction", contentType)) {
    content = JSON.stringify(message.content() as ReactionContent);
    referencedMessageId = (message.content() as ReactionContent).reference;
  }
  // else if (isContentType("coinbasePayment", contentType)) {
  // content = JSON.stringify(messageContent as CoinbaseMessagingPaymentContent);
  // }
  else {
    contentFallback = message.fallback;
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
    contentFallback,
  };
};

export const streamAllMessages = async (client: ConverseXmtpClientType) => {
  await stopStreamingAllMessage(client);
  console.log(`[XmtpRN] Streaming messages for ${client.address}`);
  client.conversations.streamAllMessages(async (message) => {
    console.log(`[XmtpRN] Received a message for ${client.address}`);
    saveMessages(client.address, [protocolMessageToStateMessage(message)]);
  });
};

export const stopStreamingAllMessage = (client: ConverseXmtpClientType) => {
  console.log(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  client.conversations.cancelStreamAllMessages();
};

export const loadConversationsMessages = async (
  client: ConverseXmtpClientType,
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
