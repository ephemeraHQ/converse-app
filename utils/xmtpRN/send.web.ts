import logger from "@utils/logger";
import { ContentTypeReaction, Reaction } from "@xmtp/content-type-reaction";
import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import {
  ContentTypeTransactionReference,
  TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import { ContentTypeText, Conversation, fromNanoString } from "@xmtp/xmtp-js";

import { deserializeRemoteAttachmentMessageContent } from "./attachments";
import { isContentType } from "./contentTypes";
import { getConversationWithTopic } from "./conversations.web";
import { Message as MessageEntity } from "../../data/db/entities/messageEntity";
import {
  markMessageAsSent,
  updateMessagesIds,
} from "../../data/helpers/messages";
import { getMessagesToSend } from "../../data/helpers/messages/getMessagesToSend.web";
import { xmtpMessageToDb } from "../../data/mappers";

let sendingPendingMessages = false;
const sendingMessages: { [messageId: string]: boolean } = {};

type PreparedMessage = Awaited<ReturnType<Conversation["prepareMessage"]>>;

type ConversePreparedMessage = PreparedMessage & {
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
      await preparedMessage.send();
      // Here message has been sent, let's mark it as
      // sent locally to make sure we don't sent twice
      await markMessageAsSent(account, id, preparedMessage.topic);
      delete sendingMessages[id];
    } catch (e: any) {
      logger.debug("Could not send message, will probably try again later", e);
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
    logger.debug(`Trying to send ${messagesToSend.length} pending messages...`);
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
        message.topic
      );
      if (conversation) {
        let preparedMessage: PreparedMessage;
        if (isContentType("remoteAttachment", message.contentType)) {
          preparedMessage = await conversation.prepareMessage(
            deserializeRemoteAttachmentMessageContent(message.content),
            { contentType: ContentTypeRemoteAttachment }
          );
        } else if (isContentType("reaction", message.contentType)) {
          preparedMessage = await conversation.prepareMessage(
            JSON.parse(message.content) as Reaction,
            { contentType: ContentTypeReaction }
          );
        } else if (isContentType("transactionReference", message.contentType)) {
          preparedMessage = await conversation.prepareMessage(
            JSON.parse(message.content) as TransactionReference,
            { contentType: ContentTypeTransactionReference }
          );
        } else if (
          message.referencedMessageId &&
          isContentType("text", message.contentType)
        ) {
          const reply: Reply = {
            reference: message.referencedMessageId,
            contentType: ContentTypeText,
            content: message.content,
          };

          preparedMessage = await conversation.prepareMessage(reply, {
            contentType: ContentTypeReply,
          });
        } else {
          preparedMessage = await conversation.prepareMessage(message.content);
        }

        const newMessageId = await preparedMessage.messageID();
        preparedMessagesToSend.set(newMessageId, {
          topic: message.topic,
          messageEnvelope: preparedMessage.messageEnvelope,
          onSend: preparedMessage.onSend,
          messageID: preparedMessage.messageID,
          send: preparedMessage.send,
        });
        messageIdsToUpdate[message.id] = {
          newMessageId,
          newMessageSent:
            fromNanoString(
              preparedMessage.messageEnvelope.timestampNs
            )?.getTime() || 0,
          message: xmtpMessageToDb(message, message.topic),
        };
      } else {
        logger.debug(
          `Did not find the conversation for topic ${message.topic}, will retry...`
        );
      }
    }
    await updateMessagesIds(account, messageIdsToUpdate);
    await sendConversePreparedMessages(account, preparedMessagesToSend);
  } catch (e) {
    logger.debug(e);
  }
  sendingPendingMessages = false;
};
