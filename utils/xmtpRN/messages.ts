import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import {
  DecodedMessage,
  ReactionContent,
  RemoteAttachmentContent,
  ReplyContent,
  StaticAttachmentContent,
} from "@xmtp/react-native-sdk";

import { saveMessages } from "../../data/helpers/messages";
import { XmtpMessage } from "../../data/store/chatStore";
import { addLog } from "../debug";
import { sentryTrackError } from "../sentry";
import { serializeRemoteAttachmentMessageContent } from "./attachments";
import { ConverseXmtpClientType, DecodedMessageWithCodecsType } from "./client";
import { getMessageContentType, isContentType } from "./contentTypes";
import { CoinbaseMessagingPaymentContent } from "./contentTypes/coinbasePayment";
import { getXmtpClient } from "./sync";

const BATCH_QUERY_PAGE_SIZE = 30;

type SerializedMessageContent = {
  content: string;
  referencedMessageId?: string | undefined;
  supported: boolean;
  contentType: string;
};

const serializeProtocolMessageContent = (
  client: ConverseXmtpClientType,
  contentType: string,
  messageContent: any
): SerializedMessageContent => {
  let referencedMessageId: string | undefined = undefined;
  let content = "";
  let supported = !!getMessageContentType(contentType);
  if (isContentType("text", contentType)) {
    content = messageContent as string;
  } else if (isContentType("remoteAttachment", contentType)) {
    content = serializeRemoteAttachmentMessageContent(
      messageContent as RemoteAttachmentContent
    );
  } else if (isContentType("attachment", contentType)) {
    content = JSON.stringify(messageContent as StaticAttachmentContent);
  } else if (isContentType("reaction", contentType)) {
    content = JSON.stringify(messageContent as ReactionContent);
    referencedMessageId = (messageContent as ReactionContent).reference;
  } else if (isContentType("reply", contentType)) {
    const replyContent = messageContent as ReplyContent;
    const replyContentType = replyContent.contentType;
    // Some content types we don't handle as replies:
    // You can't reply a reply or a reaction
    if (
      isContentType("reply", replyContentType) ||
      isContentType("reaction", replyContentType)
    ) {
      return {
        content: "",
        contentType: replyContentType,
        supported: false,
      };
    }
    const codec = client.codecRegistry[replyContentType];
    const actualReplyContent = codec.decode(replyContent.content);
    // Now that we have the content of the reply,
    // let's also pass it through the serialize method
    const serializedReply = serializeProtocolMessageContent(
      client,
      replyContentType,
      actualReplyContent
    );
    // Now that we have the actual content of this message, we can just save it
    // as is, and just mark it as a reference to another message
    return {
      ...serializedReply,
      referencedMessageId: replyContent.reference,
    };
  } else if (isContentType("transactionReference", contentType)) {
    content = JSON.stringify(messageContent as TransactionReference);
  } else if (isContentType("coinbasePayment", contentType)) {
    content = JSON.stringify(messageContent as CoinbaseMessagingPaymentContent);
  } else {
    supported = false;
  }
  return {
    content,
    contentType,
    referencedMessageId,
    supported,
  };
};

const protocolMessageToStateMessage = (
  message: DecodedMessageWithCodecsType
): XmtpMessage => {
  const supportedContentType = !!getMessageContentType(message.contentTypeId);
  const { content, referencedMessageId, contentType, supported } =
    serializeProtocolMessageContent(
      message.client,
      message.contentTypeId,
      supportedContentType ? message.content() : undefined
    );
  return {
    id: message.id,
    senderAddress: message.senderAddress,
    sent: message.sent,
    contentType,
    status: "delivered",
    sentViaConverse: message.sentViaConverse || false,
    content,
    referencedMessageId,
    topic: message.topic,
    contentFallback:
      supportedContentType && supported ? undefined : message.fallback,
  };
};

const protocolMessagesToStateMessages = (
  messages: DecodedMessageWithCodecsType[]
) => {
  // Try to decode messages, ignore messages that can't be decoded
  // so we at least get back some messages from our logic if there
  // is a messed up messsage
  const xmtpMessages: XmtpMessage[] = [];
  messages.forEach((message) => {
    try {
      xmtpMessages.push(protocolMessageToStateMessage(message));
    } catch (e) {
      sentryTrackError(e, {
        error: "Could not decode message",
        contentType: message.contentTypeId,
      });
    }
  });
  return xmtpMessages;
};

export const streamAllMessages = async (account: string) => {
  await stopStreamingAllMessage(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  console.log(`[XmtpRN] Streaming messages for ${client.address}`);
  client.conversations.streamAllMessages(async (message) => {
    console.log(`[XmtpRN] Received a message for ${client.address}`);
    saveMessages(client.address, protocolMessagesToStateMessages([message]));
  });
};

export const stopStreamingAllMessage = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  console.log(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  client.conversations.cancelStreamAllMessages();
};

export const syncConversationsMessages = async (
  account: string,
  _queryConversationsFromTimestamp: { [topic: string]: number }
): Promise<number> => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
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
        queryConversationsFromTimestamp[topic] += 1;
      }
    });

    messagesBatch.sort((messageA, messageB) => messageA.sent - messageB.sent);
    messagesFetched += messagesBatch.length;
    saveMessages(
      client.address,
      protocolMessagesToStateMessages(messagesBatch)
    );
  }
  addLog(`Fetched ${messagesFetched} messages from network`);
  return messagesFetched;
};

export const loadOlderMessages = async (account: string, topic: string) => {};
