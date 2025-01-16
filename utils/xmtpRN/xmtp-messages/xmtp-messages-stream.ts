import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { updateConversationInConversationsQueryData } from "@/queries/conversations-query";
import { updateConversationQueryData } from "@/queries/useConversationQuery";
import {
  invalidateGroupMembersQuery,
  refetchGroupMembersQuery,
} from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { isProd } from "@/utils/getEnv";
import { addConversationMessageQuery } from "@/queries/use-conversation-messages-query";
import logger from "@utils/logger";
import type {
  ConversationTopic,
  GroupUpdatedContent,
} from "@xmtp/react-native-sdk";
import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
} from "../client.types";
import { getXmtpClient } from "../sync";

export const streamAllMessages = async (account: string) => {
  await stopStreamingAllMessage(account);

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  logger.info(`[XmtpRN] Streaming messages for ${client.address}`);

  await client.conversations.streamAllMessages(async (message) => {
    logger.info(`[XmtpRN] Received a message for ${client.address}`, {
      id: message.id,
      text: isProd ? "Redacted" : message.nativeContent.text,
      topic: message.topic,
    });

    if (message.contentTypeId.includes("group_updated")) {
      try {
        await handleNewGroupUpdatedMessage({
          account: client.address,
          topic: message.topic,
          message,
        });
      } catch (error) {
        captureError(error);
      }
    }

    // When sending text messages, we handle them optimistically in the send mutation.
    // So we skip handling text messages from the current user here to avoid duplicates.
    // However, we still need to handle:
    // 1. Messages from other users
    // 2. Non-text messages from current user (since these don't have optimistic updates yet)
    const isMessageFromOtherUser = !messageIsFromCurrentAccountInboxId({
      message,
    });
    const isNonTextMessage = !isTextMessage(message);
    if (isMessageFromOtherUser || isNonTextMessage) {
      try {
        addConversationMessageQuery({
          account: client.address,
          topic: message.topic as ConversationTopic,
          message,
        });
      } catch (error) {
        captureError(error);
      }
    }

    // Update the single conversation query lastMessage
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

    // Update the conversations query specific conversation lastMessage
    try {
      updateConversationInConversationsQueryData({
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

// Map of field names to their corresponding update keys
// Seems that we can't get those types from the SDK?
const METADATA_FIELD_MAP = {
  group_name: "name",
  group_image_url_square: "imageUrlSquare",
  description: "description",
} as const;
type MetadataField = keyof typeof METADATA_FIELD_MAP;

function handleNewGroupUpdatedMessage(args: {
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) {
  const { account, topic, message } = args;

  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;

  // Handle member changes
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    refetchGroupMembersQuery(account, topic).catch(captureError);
    return;
  }

  // Handle metadata changes
  if (content.metadataFieldsChanged.length > 0) {
    content.metadataFieldsChanged.forEach((field) => {
      const fieldName = field.fieldName as MetadataField;

      // Capture error if field name is not supported
      if (!(fieldName in METADATA_FIELD_MAP)) {
        captureError(
          new Error(`Unsupported metadata field name: ${fieldName}`)
        );
        return;
      }

      const updateKey = METADATA_FIELD_MAP[fieldName];
      if (updateKey && field.newValue) {
        const update = { [updateKey]: field.newValue };

        updateConversationQueryData({
          account,
          topic,
          conversationUpdate: update,
        });

        updateConversationInConversationsQueryData({
          account,
          topic,
          conversationUpdate: update,
        });
      }
    });
    return;
  }

  // Handle admin updates (when no other changes detected)
  invalidateGroupMembersQuery(account, topic);
}
