import { Reaction } from "@xmtp/content-type-reaction";
import {
  RemoteAttachment,
  Attachment,
} from "@xmtp/content-type-remote-attachment";
import { Reply } from "@xmtp/content-type-reply";
import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import { messageApi } from "@xmtp/proto";
import { Envelope } from "@xmtp/proto/ts/dist/types/message_api/v1/message_api.pb";
import { Client, DecodedMessage } from "@xmtp/xmtp-js";

import { saveMessages } from "../../data/helpers/messages";
import { XmtpMessage } from "../../data/store/chatStore";
import { sentryTrackError } from "../sentry";
import { serializeRemoteAttachmentMessageContent } from "./attachments.web";
import { isContentType } from "./contentTypes";
import { CoinbaseMessagingPaymentContent } from "./contentTypes/coinbasePayment";
import { getConversationWithTopic } from "./conversations.web";
import { getXmtpClient } from "./sync";

type SerializedMessageContent = {
  content: string;
  referencedMessageId?: string | undefined;
  supportedContentType: boolean;
  contentType: string;
};

const serializeProtocolMessageContent = (
  contentType: string,
  messageContent: any
): SerializedMessageContent => {
  let referencedMessageId: string | undefined = undefined;
  let content = "";
  let supportedContentType = true;
  if (isContentType("text", contentType)) {
    content = messageContent as string;
  } else if (isContentType("remoteAttachment", contentType)) {
    content = serializeRemoteAttachmentMessageContent(
      messageContent as RemoteAttachment
    );
  } else if (isContentType("attachment", contentType)) {
    content = JSON.stringify(messageContent as Attachment);
  } else if (isContentType("reaction", contentType)) {
    content = JSON.stringify(messageContent as Reaction);
    referencedMessageId = (messageContent as Reaction).reference;
  } else if (isContentType("reply", contentType)) {
    const replyContent = messageContent as Reply;
    const replyContentType = replyContent.contentType.toString();
    // Some content types we don't handle as replies:
    // You can't reply a reply or a reaction
    if (
      isContentType("reply", replyContentType) ||
      isContentType("reaction", replyContentType)
    ) {
      return {
        content: "",
        contentType: replyContentType,
        supportedContentType: false,
      };
    }

    const actualReplyContent = replyContent.content;
    // Now that we have the content of the reply,
    // let's also pass it through the serialize method
    const serializedReply = serializeProtocolMessageContent(
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
    supportedContentType = false;
  }
  return {
    content,
    contentType,
    referencedMessageId,
    supportedContentType,
  };
};

const protocolMessageToStateMessage = (
  message: DecodedMessage
): XmtpMessage => {
  const { content, referencedMessageId, contentType, supportedContentType } =
    serializeProtocolMessageContent(
      message.contentType.toString(),
      message.content
    );

  return {
    id: message.id,
    senderAddress: message.senderAddress,
    sent: message.sent.getTime(),
    contentType,
    status: "delivered",
    sentViaConverse: message.sentViaConverse || false,
    content,
    referencedMessageId,
    topic: message.contentTopic,
    contentFallback: supportedContentType ? undefined : message.contentFallback,
  };
};

const protocolMessagesToStateMessages = (messages: DecodedMessage[]) => {
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
        contentType: message.contentType.toString(),
      });
    }
  });
  return xmtpMessages;
};

const messagesStream: {
  [account: string]: AsyncGenerator<DecodedMessage<any>, any, unknown>;
} = {};

export const streamAllMessages = async (account: string) => {
  await stopStreamingAllMessage(account);
  const client = (await getXmtpClient(account)) as Client;
  console.log(`[XmtpJS] Streaming messages for ${client.address}`);
  messagesStream[account] = await client.conversations.streamAllMessages();
  for await (const message of messagesStream[account]) {
    console.log(`[XmtpJS] Received a message for ${client.address}`);
    saveMessages(client.address, protocolMessagesToStateMessages([message]));
  }
};

export const stopStreamingAllMessage = async (account: string) => {
  console.log(`[XmtpJS] Stopped streaming messages for ${account}`);
  if (messagesStream[account]) {
    await messagesStream[account].return(null);
    delete messagesStream[account];
  }
};

const decodeBatchMessages = async (
  account: string,
  envelopes: Envelope[][]
): Promise<DecodedMessage[]> => {
  const allEnvelopes = ([] as Envelope[]).concat(...envelopes);
  const messagesBatch: DecodedMessage[] = [];
  await Promise.all(
    allEnvelopes.map(async (e) => {
      try {
        if (!e.contentTopic) return;
        const convo = await getConversationWithTopic(account, e.contentTopic);
        if (!convo) return;
        const message = await convo.decodeMessage(e);
        if (message) {
          messagesBatch.push(message);
        }
      } catch (e: any) {
        console.log("A message could not be decoded");
      }
    })
  );
  return messagesBatch;
};

export const syncConversationsMessages = async (
  account: string,
  queryConversationsFromTimestamp: { [topic: string]: number }
): Promise<number> => {
  // On Web, we just load the last message of each convo
  const client = (await getXmtpClient(account)) as Client;
  const topicsToQuery = Object.keys(queryConversationsFromTimestamp);
  const messagesBatch = await decodeBatchMessages(
    account,
    await client.apiClient.batchQuery(
      topicsToQuery.map((topic) => ({
        contentTopic: topic,
        pageSize: 1,
        direction: messageApi.SortDirection.SORT_DIRECTION_DESCENDING,
      }))
    )
  );
  console.log(
    `[XmtpJS] Fetched ${messagesBatch.length} envelopes from network for ${client.address}`
  );
  messagesBatch.sort(
    (messageA, messageB) => messageA.sent.getTime() - messageB.sent.getTime()
  );
  saveMessages(client.address, protocolMessagesToStateMessages(messagesBatch));
  return messagesBatch.length;
};

const loadedOlderMessagesForTopic: {
  [account: string]: { [topic: string]: boolean };
} = {};

export const loadOlderMessages = async (account: string, topic: string) => {
  loadedOlderMessagesForTopic[account] =
    loadedOlderMessagesForTopic[account] || {};
  if (loadedOlderMessagesForTopic[account][topic]) {
    return;
  }
  const client = (await getXmtpClient(account)) as Client;
  const conversation = await getConversationWithTopic(account, topic);
  if (!conversation) return;
  const messages = await decodeBatchMessages(
    account,
    await client.apiClient.batchQuery([
      {
        contentTopic: topic,
        pageSize: 100,
        direction: messageApi.SortDirection.SORT_DIRECTION_DESCENDING,
      },
    ])
  );
  loadedOlderMessagesForTopic[account][topic] = true;
  saveMessages(client.address, protocolMessagesToStateMessages(messages));
};
