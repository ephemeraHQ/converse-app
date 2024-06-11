import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import {
  DecodedMessage,
  GroupUpdatedContent,
  Member,
  ReactionContent,
  RemoteAttachmentContent,
  ReplyContent,
  StaticAttachmentContent,
} from "@xmtp/react-native-sdk";

import { getOrderedMessages, saveMessages } from "../../data/helpers/messages";
import { xmtpMessageFromDb } from "../../data/mappers";
import { getChatStore } from "../../data/store/accountsStore";
import { XmtpMessage } from "../../data/store/chatStore";
import { addLog } from "../debug";
import { sentryTrackError } from "../sentry";
import { serializeRemoteAttachmentMessageContent } from "./attachments";
import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "./client";
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
    // @ts-ignore
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
    // @ts-ignore
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
  } else if (isContentType("groupUpdated", contentType)) {
    content = JSON.stringify(messageContent as GroupUpdatedContent);
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

  // For now, use the group member linked address as "senderAddress"
  // @todo => make inboxId a first class citizen
  let senderAddress = message.senderAddress;
  if (message.topic.startsWith("/xmtp/mls/1/g-")) {
    const groupMember = groupMembers[message.topic]?.find(
      (m) => m.inboxId === message.senderAddress
    );
    if (groupMember) {
      senderAddress = groupMember.addresses[0];
    }
  }

  return {
    id: message.id,
    senderAddress,
    sent: message.sent,
    contentType,
    status: "delivered",
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
  await client.conversations.streamAllMessages(async (message) => {
    console.log(`[XmtpRN] Received a message for ${client.address}`, {
      id: message.id,
      text: message.nativeContent.text,
      topic: message.topic,
    });
    saveMessages(client.address, protocolMessagesToStateMessages([message]));
  }, true);
};

export const stopStreamingAllMessage = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  console.log(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  client.conversations.cancelStreamAllMessages();
};

// export const streamAllGroupMessages = async (account: string) => {
//   await stopStreamingAllGroupMessage(account);
//   const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
//   console.log(`[XmtpRN] Streaming group messages for ${client.address}`);
//   await client.conversations.streamAllGroupMessages(async (message) => {
//     console.log(
//       `[XmtpRN] Received a group message for ${client.address}`,
//       message.nativeContent.text,
//       message.id
//     );
//     saveMessages(client.address, protocolMessagesToStateMessages([message]));
//   });
// };

// export const stopStreamingAllGroupMessage = async (account: string) => {
//   const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
//   console.log(
//     `[XmtpRN] Stopped streaming group messages for ${client.address}`
//   );
//   client.conversations.cancelStreamAllGroupMessages();
// };

const groupMembers: { [topic: string]: Member[] } = {};

export const syncGroupsMessages = async (
  account: string,
  groups: GroupWithCodecsType[],
  queryGroupsFromTimestamp: { [topic: string]: number }
) => {
  console.log(`Syncing ${groups.length} groups...`);
  for (const group of groups) {
    console.log("syncing group", group.topic);
    await group.sync();
    groupMembers[group.topic] = await group.members();
    console.log("synced group", group.topic);
  }
  console.log(`${groups.length} groups synced!`);
  const newMessages = (
    await Promise.all(
      groups.map((g) =>
        g.messages({
          after: queryGroupsFromTimestamp[g.topic],
          direction: "SORT_DIRECTION_ASCENDING",
        })
      )
    )
  ).flat();
  console.log(`${newMessages.length} groups messages pulled`);
  saveMessages(account, protocolMessagesToStateMessages(newMessages));
  return newMessages.length;
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
      messagesByTopic[m.topic].push(m as DecodedMessage);
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

const loadedOlderMessagesForTopic: {
  [account: string]: { [topic: string]: boolean };
} = {};

export const loadOlderMessages = async (account: string, topic: string) => {
  loadedOlderMessagesForTopic[account] =
    loadedOlderMessagesForTopic[account] || {};
  const chatStore = getChatStore(account).getState();
  // Pending convos: does not make sense
  if (chatStore.conversations[topic]?.pending) return;
  // Alread loaded
  if (loadedOlderMessagesForTopic[account][topic]) return;
  // Just mapped, so was created inside this session, no need to fetch
  if (Object.values(chatStore.conversationsMapping).includes(topic)) return;
  await new Promise((r) => setTimeout(r, 500));
  // On mobile this loads all messages from the local db
  const messages = await getOrderedMessages(account, topic);
  getChatStore(account).getState().setMessages(messages.map(xmtpMessageFromDb));
  loadedOlderMessagesForTopic[account][topic] = true;
};

export const removePrefixesAndTrailingSlash = (url: string) => {
  const prefixRegex = /^(https?:\/\/)?(www\.)?/i;
  const trailingSlashRegex = /\/$/;

  let result = url.replace(prefixRegex, "");
  result = result.replace(trailingSlashRegex, "");
  return result;
};

const isEmoji = (character: string) => {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  return emojiRegex.test(character);
};

export const isAllEmojisAndMaxThree = (str: string) => {
  const strWithoutSpaces = str.replaceAll(" ", "");
  const iterator = [...strWithoutSpaces];
  let emojiCount = 0;

  for (const char of iterator) {
    if (isEmoji(char)) {
      emojiCount++;
    } else {
      // break if any aren't emojis
      return false;
    }
  }
  return emojiCount > 0 && emojiCount <= 3;
};
