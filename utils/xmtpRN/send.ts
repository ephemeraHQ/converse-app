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

import { deserializeRemoteAttachmentMessageContent } from "./attachments";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "./client";
import { isContentType } from "./contentTypes";
import { getConversationWithTopic } from "./conversations";
import { getXmtpClient } from "./sync";
import { Message as MessageEntity } from "../../data/db/entities/messageEntity";
import {
  markMessageAsPrepared,
  markMessageAsSent,
  updateMessagesIds,
} from "../../data/helpers/messages";
import { getMessagesToSend } from "../../data/helpers/messages/getMessagesToSend";

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

const publishConverseGroupMessages = async (groups: GroupWithCodecsType[]) => {
  try {
    await Promise.all(
      Object.values(groups).map((g) => g.publishPreparedMessages())
    );
  } catch (e) {
    console.log("Could not send message, will probably try again later", e);
  }
};

const sendConverseGroupMessages = async (
  account: string,
  groupMessages: Map<
    string,
    { group: GroupWithCodecsType; message: MessageEntity; topic: string }
  >
) => {
  const groups: { [groupId: string]: GroupWithCodecsType } = {};
  for (const id of groupMessages.keys()) {
    const preparedGroupMessage = groupMessages.get(id);
    if (
      !preparedGroupMessage ||
      sendingMessages[id] ||
      !preparedGroupMessage.topic
    )
      continue;
    sendingMessages[id] = true;
    await markMessageAsPrepared(account, id, preparedGroupMessage.topic);
    groups[preparedGroupMessage.group.id] = preparedGroupMessage.group;
  }
  await publishConverseGroupMessages(Object.values(groups));
  // If it worked we can mark them as sent
  for (const id of groupMessages.keys()) {
    const preparedGroupMessage = groupMessages.get(id);
    if (
      !preparedGroupMessage ||
      !sendingMessages[id] ||
      !preparedGroupMessage.topic
    )
      continue;
    delete sendingMessages[id];
    await markMessageAsSent(account, id, preparedGroupMessage.topic);
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
      { group: GroupWithCodecsType; message: MessageEntity; topic: string }
    > = new Map();
    const messageIdsToUpdate: {
      [messageId: string]: {
        newMessageId: string;
        newMessageSent: number;
        message: MessageEntity;
      };
    } = {};
    const groupsWithPreparedMessages: {
      [groupId: string]: GroupWithCodecsType;
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
        if ((conversation as any).peerAddress && message.status === "sending") {
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
          // This is a group message. Preparing it will store
          // it in libxmtp db to be published later, it's different
          // from 1v1 prepareMessage which needs to be sent using sendPreparedMessage
          const group = conversation as GroupWithCodecsType;
          if (message.status === "sending") {
            const newMessageId = await group.prepareMessage(
              getMessageContent(message)
            );
            groupMessagesToSend.set(newMessageId, {
              group,
              message,
              topic: message.conversationId,
            });
            messageIdsToUpdate[message.id] = {
              newMessageId,
              newMessageSent: new Date().getTime(),
              message,
            };
          } else if (message.status === "prepared") {
            // We prepared it but was not published, let's publish them at the end
            groupsWithPreparedMessages[group.id] = group;
          }
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
    await publishConverseGroupMessages(
      Object.values(groupsWithPreparedMessages)
    );
  } catch (e) {
    console.log(e);
  }
  sendingPendingMessages = false;
};
