import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { messageIsFromCurrentUserV3 } from "@/features/conversation/utils/message-is-from-current-user";
import { updateConversationInConversationListQuery } from "@/queries/useConversationListQuery";
import { updateConversationQueryData } from "@/queries/useConversationQuery";
import { invalidateGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { addConversationMessage } from "@queries/useConversationMessages";
import logger from "@utils/logger";
import type {
  ConversationTopic,
  GroupUpdatedContent,
} from "@xmtp/react-native-sdk";
import config from "../../config";
import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
} from "./client.types";
import { getXmtpClient } from "./sync";

export const streamAllMessages = async (account: string) => {
  await stopStreamingAllMessage(account);

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  logger.info(`[XmtpRN] Streaming messages for ${client.address}`);

  await client.conversations.streamAllMessages(async (message) => {
    logger.info(`[XmtpRN] Received a message for ${client.address}`, {
      id: message.id,
      text: config.env === "prod" ? "Redacted" : message.nativeContent.text,
      topic: message.topic,
    });

    if (message.contentTypeId.includes("group_updated")) {
      try {
        await handleGroupUpdatedMessage(
          client.address,
          message.topic as ConversationTopic,
          message
        );
      } catch (error) {
        captureError(error);
      }
    }

    // We already handle text messages from the current user locally via react-query.
    // Doing this for optimistic updates.
    // We only need to handle messages that are either:
    // 1. From other users
    // 2. Non-text messages from current user
    const isMessageFromOtherUser = !messageIsFromCurrentUserV3({ message });
    const isNonTextMessage = !isTextMessage(message);
    if (isMessageFromOtherUser || isNonTextMessage) {
      try {
        addConversationMessage({
          account: client.address,
          topic: message.topic as ConversationTopic,
          message,
        });
      } catch (error) {
        captureError(error);
      }
    }

    try {
      updateConversationQueryData({
        account: client.address,
        topic: message.topic as ConversationTopic,
        conversationUpdate: {
          lastMessage: message,
        },
      });
    } catch (error) {
      captureError(error);
    }

    try {
      updateConversationInConversationListQuery({
        account: client.address,
        topic: message.topic as ConversationTopic,
        conversationUpdate: {
          lastMessage: message,
        },
      });
    } catch (error) {
      captureError(error);
    }
  });
};

export const stopStreamingAllMessage = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  logger.debug(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  await client.conversations.cancelStreamAllMessages();
};

export const handleGroupUpdatedMessage = async (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    // This will refresh members
    invalidateGroupMembersQuery(account, topic);
  }
  if (content.metadataFieldsChanged.length > 0) {
    let newGroupName = "";
    let newGroupPhotoUrl = "";
    let newGroupDescription = "";
    for (const field of content.metadataFieldsChanged) {
      if (field.fieldName === "group_name") {
        newGroupName = field.newValue;
      } else if (field.fieldName === "group_image_url_square") {
        newGroupPhotoUrl = field.newValue;
      } else if (field.fieldName === "description") {
        newGroupDescription = field.newValue;
      }
    }
    if (!!newGroupName) {
      updateConversationQueryData({
        account,
        topic,
        conversationUpdate: {
          name: newGroupName,
        },
      });
      updateConversationInConversationListQuery({
        account,
        topic,
        conversationUpdate: {
          name: newGroupName,
        },
      });
    }
    if (!!newGroupPhotoUrl) {
      updateConversationQueryData({
        account,
        topic,
        conversationUpdate: {
          imageUrlSquare: newGroupPhotoUrl,
        },
      });
      updateConversationInConversationListQuery({
        account,
        topic,
        conversationUpdate: {
          imageUrlSquare: newGroupPhotoUrl,
        },
      });
    }
    if (!!newGroupDescription) {
      updateConversationQueryData({
        account,
        topic,
        conversationUpdate: {
          description: newGroupDescription,
        },
      });
      updateConversationInConversationListQuery({
        account,
        topic,
        conversationUpdate: {
          description: newGroupDescription,
        },
      });
    }
  }
  // Admin Update
  if (
    content.membersAdded.length === 0 &&
    content.membersRemoved.length === 0 &&
    content.metadataFieldsChanged.length === 0
  ) {
    invalidateGroupMembersQuery(account, topic);
  }
};
