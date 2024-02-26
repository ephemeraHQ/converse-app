import {
  ContentTypeTransactionReference,
  TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  PreparedLocalMessage,
  sendPreparedMessage,
} from "@xmtp/react-native-sdk";

import { Message as MessageEntity } from "../../data/db/entities/messageEntity";
import {
  markMessageAsSent,
  updateMessagesIds,
} from "../../data/helpers/messages";
import { getMessagesToSend } from "../../data/helpers/messages/getMessagesToSend";
import { deserializeRemoteAttachmentMessageContent } from "./attachments";
import { isContentType } from "./contentTypes";
import { getConversationWithTopic } from "./conversations";

let sendingPendingMessages = false;
const sendingMessages: { [messageId: string]: boolean } = {};

type ConversePreparedMessage = PreparedLocalMessage & {
  topic: string;
};

const sendConversePreparedMessages = async (
  account: string,
  preparedMessages: Map<string, ConversePreparedMessage>
) => {
  for (const id of preparedMessages.keys()) {
    const preparedMessage = preparedMessages.get(id);
    if (!preparedMessage) continue;
    try {
      if (sendingMessages[id] || !preparedMessage.topic) {
        return;
      }
      sendingMessages[id] = true;
      await sendPreparedMessage(account, preparedMessage);
      // Here message has been sent, let's mark it as
      // sent locally to make sure we don't sent twice
      await markMessageAsSent(account, id, preparedMessage.topic);
      delete sendingMessages[id];
    } catch (e: any) {
      console.log("Could not send message, will probably try again later", e);
      delete sendingMessages[id];
    }
  }
};

export const sendPendingMessages = async (account: string) => {
  if (sendingPendingMessages) {
    return;
  }
  sendingPendingMessages = true;
  try {
    const messagesToSend = await getMessagesToSend(account);
    if (messagesToSend.length === 0) {
      sendingPendingMessages = false;
      return;
    }
    console.log(`Trying to send ${messagesToSend.length} pending messages...`);
    const preparedMessagesToSend: Map<string, ConversePreparedMessage> =
      new Map();
    const messageIdsToUpdate: {
      [messageId: string]: {
        newMessageId: string;
        newMessageSent: number;
        message: MessageEntity;
      };
    } = {};
    for (const message of messagesToSend) {
      if (sendingMessages[message.id]) {
        continue;
      }
      const conversation = await getConversationWithTopic(
        account,
        message.conversationId
      );
      if (conversation) {
        let preparedMessage: PreparedLocalMessage;
        if (isContentType("remoteAttachment", message.contentType)) {
          preparedMessage = await conversation.prepareMessage({
            remoteAttachment: deserializeRemoteAttachmentMessageContent(
              message.content
            ),
          });
        } else if (isContentType("reaction", message.contentType)) {
          preparedMessage = await conversation.prepareMessage({
            reaction: JSON.parse(message.content),
          });
        } else if (isContentType("transactionReference", message.contentType)) {
          preparedMessage = await conversation.prepareMessage(
            JSON.parse(message.content) as TransactionReference,
            { contentType: ContentTypeTransactionReference }
          );
        } else if (
          message.referencedMessageId &&
          isContentType("text", message.contentType)
        ) {
          preparedMessage = await conversation.prepareMessage({
            reply: {
              reference: message.referencedMessageId,
              content: { text: message.content },
            },
          });
        } else {
          preparedMessage = await conversation.prepareMessage({
            text: message.content,
          });
        }

        const newMessageId = preparedMessage.messageId;
        preparedMessagesToSend.set(newMessageId, {
          ...preparedMessage,
          topic: message.conversationId,
        });
        messageIdsToUpdate[message.id] = {
          newMessageId,
          newMessageSent: preparedMessage.preparedAt,
          message,
        };
      } else {
        console.log(
          `Did not find the conversation for topic ${message.conversationId}, will retry...`
        );
      }
    }
    await updateMessagesIds(account, messageIdsToUpdate);
    await sendConversePreparedMessages(account, preparedMessagesToSend);
  } catch (e) {
    console.log(e);
  }
  sendingPendingMessages = false;
};
