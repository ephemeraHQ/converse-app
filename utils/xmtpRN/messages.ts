import { TransactionReference } from "@xmtp/content-type-transaction-reference";
import {
  DecodedMessage,
  GroupChangeContent,
  ReactionContent,
  RemoteAttachmentContent,
  StaticAttachmentContent,
} from "@xmtp/react-native-sdk";

import { saveMessages } from "../../data/helpers/messages";
import { XmtpMessage } from "../../data/store/chatStore";
import { addLog } from "../debug";
import { sentryTrackError } from "../sentry";
import { serializeRemoteAttachmentMessageContent } from "./attachments";
import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "./client";
import { isContentType } from "./contentTypes";
import { CoinbaseMessagingPaymentContent } from "./contentTypes/coinbasePayment";
import { getXmtpClient } from "./sync";

const BATCH_QUERY_PAGE_SIZE = 30;

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
    content = serializeRemoteAttachmentMessageContent(
      message.content() as RemoteAttachmentContent
    );
  } else if (isContentType("attachment", contentType)) {
    content = JSON.stringify(message.content() as StaticAttachmentContent);
  } else if (isContentType("reaction", contentType)) {
    content = JSON.stringify(message.content() as ReactionContent);
    referencedMessageId = (message.content() as ReactionContent).reference;
  } else if (isContentType("transactionReference", contentType)) {
    content = JSON.stringify(message.content() as TransactionReference);
  } else if (isContentType("coinbasePayment", contentType)) {
    content = JSON.stringify(
      message.content() as CoinbaseMessagingPaymentContent
    );
  } else if (isContentType("groupChange", contentType)) {
    content = JSON.stringify(message.content() as GroupChangeContent);
  } else {
    console.log(message.contentTypeId);
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
    console.log(
      `[XmtpRN] Received a DM OR GROUP message for ${client.address}`,
      message.nativeContent.text,
      message.topic
    );
    saveMessages(client.address, protocolMessagesToStateMessages([message]));
  }); // @todo => fix and use true one day?
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

export const syncGroupsMessages = async (
  account: string,
  groups: GroupWithCodecsType[],
  queryGroupsFromTimestamp: { [topic: string]: number }
) => {
  console.log(`Syncing ${groups.length} groups...`);
  for (const group of groups) {
    console.log("syncing group", group.topic);
    await group.sync();
    console.log("synced group", group.topic);
  }
  console.log(`${groups.length} groups synced!`);
  console.log(queryGroupsFromTimestamp);
  const newMessages = (
    await Promise.all(
      groups.map((g) =>
        g.messages(
          true, // skipSync
          undefined, // limit
          undefined, // before
          queryGroupsFromTimestamp[g.topic], // after
          "SORT_DIRECTION_ASCENDING" // direction
        )
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
