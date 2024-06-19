import {
  ContentTypeTransactionReference,
  TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  PreparedLocalMessage,
  sendPreparedMessage,
} from "@xmtp/react-native-sdk";
import { ConversationSendPayload } from "@xmtp/react-native-sdk/build/lib/types";
import { DefaultContentTypes } from "@xmtp/react-native-sdk/build/lib/types/DefaultContentType";

import { Message as MessageEntity } from "../../data/db/entities/messageEntity";
import {
  markMessageAsSent,
  updateMessagesIds,
} from "../../data/helpers/messages";
import { getMessagesToSend } from "../../data/helpers/messages/getMessagesToSend";
import { deserializeRemoteAttachmentMessageContent } from "./attachments";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "./client";
import { isContentType } from "./contentTypes";
import { getConversationWithTopic } from "./conversations";
import { getXmtpClient } from "./sync";
// import { syncGroupsMessages } from "./messages";

let sendingPendingMessages = false;
const sendingMessages: { [messageId: string]: boolean } = {};
const sendingGroupMessages: { [messageId: string]: MessageEntity } = {};

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
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      await sendPreparedMessage(client.inboxId, preparedMessage);
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

const sendConverseGroupMessages = async (
  account: string,
  groupMessages: Map<
    string,
    { group: GroupWithCodecsType; message: MessageEntity }
  >
) => {
  // const now = new Date().getTime();
  for (const id of groupMessages.keys()) {
    const groupMessage = groupMessages.get(id);
    if (!groupMessage) continue;
    try {
      if (sendingGroupMessages[id]) {
        return;
      }
      sendingGroupMessages[id] = groupMessage.message;
      const newMessageId = await groupMessage.group.send(
        getMessageContent(groupMessage.message)
      );
      console.log("Group message sent", { newMessageId });
      await updateMessagesIds(account, {
        [groupMessage.message.id]: {
          newMessageId,
          message: groupMessage.message,
          newMessageSent: new Date().getTime(),
        },
      });
      // Here message has been sent, let's mark it as
      // sent locally to make sure we don't sent twice
      await markMessageAsSent(account, newMessageId, groupMessage.group.topic);
      // Let's refresh group ?
      // await syncGroupsMessages(account, [groupMessage.group], {
      //   [groupMessage.group.topic]: now,
      // });

      delete sendingGroupMessages[id];
    } catch (e: any) {
      console.log("Could not send message, will probably try again later", e);
      delete sendingGroupMessages[id];
    }
  }
};

const getMessageContent = (
  message: MessageEntity
): ConversationSendPayload<DefaultContentTypes> => {
  if (isContentType("remoteAttachment", message.contentType)) {
    return {
      remoteAttachment: deserializeRemoteAttachmentMessageContent(
        message.content
      ),
    };
  } else if (isContentType("reaction", message.contentType)) {
    return {
      reaction: JSON.parse(message.content),
    };
  } else if (isContentType("transactionReference", message.contentType)) {
    return (
      JSON.parse(message.content) as TransactionReference,
      { contentType: ContentTypeTransactionReference }
    );
  } else if (
    message.referencedMessageId &&
    isContentType("text", message.contentType)
  ) {
    return {
      reply: {
        reference: message.referencedMessageId,
        content: { text: message.content },
      },
    };
  } else {
    return {
      text: message.content,
    };
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
    const groupMessagesToSend: Map<
      string,
      { group: GroupWithCodecsType; message: MessageEntity }
    > = new Map();
    const messageIdsToUpdate: {
      [messageId: string]: {
        newMessageId: string;
        newMessageSent: number;
        message: MessageEntity;
      };
    } = {};
    for (const message of messagesToSend) {
      if (sendingMessages[message.id] || sendingGroupMessages[message.id]) {
        continue;
      }
      // @todo => handle groups here that don't have prepareMessage method
      const conversation = await getConversationWithTopic(
        account,
        message.conversationId
      );
      if (conversation) {
        if ((conversation as any).peerAddress) {
          // DM Conversation
          const preparedMessage = await (
            conversation as ConversationWithCodecsType
          ).prepareMessage(getMessageContent(message));
          const newMessageId = await preparedMessage.messageId;
          preparedMessagesToSend.set(newMessageId, {
            ...preparedMessage,
            topic: message.conversationId,
          });
          messageIdsToUpdate[message.id] = {
            newMessageId,
            newMessageSent: preparedMessage.preparedAt,
            message,
          };
        } else if ((conversation as any).peerInboxIds) {
          // This is a group message
          groupMessagesToSend.set(message.id, {
            group: conversation as GroupWithCodecsType,
            message,
          });
        }
      } else {
        console.log(
          `Did not find the conversation for topic ${message.conversationId}, will retry...`
        );
      }
    }
    await updateMessagesIds(account, messageIdsToUpdate);
    await sendConversePreparedMessages(account, preparedMessagesToSend);
    await sendConverseGroupMessages(account, groupMessagesToSend);
  } catch (e) {
    console.log(e);
  }
  sendingPendingMessages = false;
};
