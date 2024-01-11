import { Reaction } from "@xmtp/content-type-reaction";
import { messageApi } from "@xmtp/proto";
import { Envelope } from "@xmtp/proto/ts/dist/types/message_api/v1/message_api.pb";
import { Client, DecodedMessage } from "@xmtp/xmtp-js";

import { saveMessages } from "../../data/helpers/messages";
import { XmtpMessage } from "../../data/store/chatStore";
import { sentryTrackError } from "../sentry";
import { isContentType } from "./contentTypes";
import { getConversationWithTopic } from "./conversations.web";
import { getXmtpClient } from "./sync";

const protocolMessageToStateMessage = (
  message: DecodedMessage
): XmtpMessage => {
  let referencedMessageId: string | undefined = undefined;
  const contentType = message.contentType.toString();
  let content = "";
  let contentFallback: string | undefined = undefined;
  if (isContentType("text", contentType)) {
    content = message.content as string;
  }
  //  else if (isContentType("remoteAttachment", contentType)) {
  //   content = computeRemoteAttachmentMessageContent(
  //     message.content() as RemoteAttachmentContent
  //   );
  // } else if (isContentType("attachment", contentType)) {
  //   content = JSON.stringify(message.content() as StaticAttachmentContent);
  // }
  else if (isContentType("reaction", contentType)) {
    content = JSON.stringify(message.content as Reaction);
    referencedMessageId = (message.content as Reaction).reference;
  }
  // else if (isContentType("coinbasePayment", contentType)) {
  // content = JSON.stringify(messageContent as CoinbaseMessagingPaymentContent);
  // }
  else {
    contentFallback = message.content;
  }
  return {
    id: message.id,
    senderAddress: message.senderAddress,
    sent: message.sent.getTime(),
    contentType,
    status: "delivered",
    sentViaConverse: false,
    // sentViaConverse: message.sentViaConverse || false,
    content,
    referencedMessageId,
    topic: message.contentTopic,
    contentFallback,
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

// export const syncConversationsMessages = async (
//   account: string,
//   _queryConversationsFromTimestamp: { [topic: string]: number }
// ): Promise<number> => {
//   const client = (await getXmtpClient(account)) as Client;
//   const queryConversationsFromTimestamp = {
//     ..._queryConversationsFromTimestamp,
//   };
//   let messagesFetched = 0;

//   while (Object.keys(queryConversationsFromTimestamp).length > 0) {
//     const topicsToQuery = Object.keys(queryConversationsFromTimestamp);
//     const messagesBatch = await decodeBatchMessages(
//       account,
//       await client.apiClient.batchQuery(
//         topicsToQuery.map((topic) => ({
//           contentTopic: topic,
//           startTime: new Date(queryConversationsFromTimestamp[topic]),
//           pageSize: BATCH_QUERY_PAGE_SIZE,
//           direction: messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
//         }))
//       )
//     );

//     console.log(
//       `[XmtpJS] Fetched ${messagesBatch.length} envelopes from network for ${client.address}`
//     );

//     const oldQueryConversationsFromTimestamp = {
//       ...queryConversationsFromTimestamp,
//     };

//     const messagesByTopic: { [topic: string]: DecodedMessage[] } = {};
//     messagesBatch.forEach((m) => {
//       messagesByTopic[m.contentTopic] = messagesByTopic[m.contentTopic] || [];
//       messagesByTopic[m.contentTopic].push(m);
//       if (m.sent.getTime() > queryConversationsFromTimestamp[m.contentTopic]) {
//         queryConversationsFromTimestamp[m.contentTopic] = m.sent.getTime();
//       }
//     });

//     topicsToQuery.forEach((topic) => {
//       const messages = messagesByTopic[topic];
//       if (!messages || messages.length <= 1) {
//         // When we have no more messages for a topic it means we have gone through all of it
//         // Checking if messages.length < BATCH_QUERY_PAGE_SIZE would be more performant (one less query
//         // per topic) but could miss messages because if there are messages that are not decoded they
//         // are not returned by listBatchMessages)
//         delete queryConversationsFromTimestamp[topic];
//       }
//     });

//     // To avoid a loop let's verify that we don't query a topic
//     // again with the exact same timestamp
//     Object.keys(queryConversationsFromTimestamp).forEach((topic) => {
//       if (
//         queryConversationsFromTimestamp[topic] ===
//         oldQueryConversationsFromTimestamp[topic]
//       ) {
//         console.log(
//           "[XmtpRn] Avoiding a loop during sync due to weird timestamps"
//         );
//         queryConversationsFromTimestamp[topic] += 1;
//       }
//     });

//     messagesBatch.sort(
//       (messageA, messageB) => messageA.sent.getTime() - messageB.sent.getTime()
//     );
//     messagesFetched += messagesBatch.length;
//     saveMessages(
//       client.address,
//       protocolMessagesToStateMessages(messagesBatch)
//     );
//   }
//   addLog(`Fetched ${messagesFetched} messages from network`);
//   return messagesFetched;
// };
