import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { addConversationMessageQuery } from "@/queries/use-conversation-messages-query";
import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { updateConversationQueryData } from "@/queries/useConversationQuery";
import { refetchGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import {
  stopStreamingAllMessage,
  streamAllMessages,
} from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { ConversationTopic, GroupUpdatedContent } from "@xmtp/react-native-sdk";

export async function startMessageStreaming(args: { account: string }) {
  const { account } = args;
  await streamAllMessages({
    account,
    onNewMessage: (message) => handleNewMessage({ account, message }),
  });
}

export { stopStreamingAllMessage };

async function handleNewMessage(args: {
  account: string;
  message: DecodedMessageWithCodecsType;
}) {
  const { account, message } = args;

  if (message.contentTypeId.includes("group_updated")) {
    try {
      await handleNewGroupUpdatedMessage({
        account,
        topic: message.topic,
        message,
      });
    } catch (error) {
      captureError(error);
    }
  }

  const isMessageFromOtherUser = !messageIsFromCurrentAccountInboxId({
    message,
  });
  const isNonTextMessage = !isTextMessage(message);

  if (isMessageFromOtherUser || isNonTextMessage) {
    try {
      addConversationMessageQuery({
        account,
        topic: message.topic as ConversationTopic,
        message,
      });
    } catch (error) {
      captureError(error);
    }
  }

  try {
    updateConversationQueryData({
      account,
      topic: message.topic as ConversationTopic,
      conversationUpdate: {
        lastMessage: message,
      },
    });
  } catch (error) {
    captureError(error);
  }

  try {
    updateConversationInConversationsQueryData({
      account,
      topic: message.topic as ConversationTopic,
      conversationUpdate: {
        lastMessage: message,
      },
    });
  } catch (error) {
    captureError(error);
  }
}

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

  // Early return if not a group update message
  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;

  // Handle member changes by refetching the group members
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    refetchGroupMembersQuery({ account, topic }).catch(captureError);
    return;
  }

  // Process metadata changes (e.g., group name, image, description)
  if (content.metadataFieldsChanged.length > 0) {
    content.metadataFieldsChanged.forEach((field) => {
      const fieldName = field.fieldName as MetadataField;

      // Validate that the field is supported
      if (!(fieldName in METADATA_FIELD_MAP)) {
        captureError(
          new Error(`Unsupported metadata field name: ${fieldName}`)
        );
        return;
      }

      // Map the field name to our internal property name and update if there's a new value
      const updateKey = METADATA_FIELD_MAP[fieldName];
      if (updateKey && field.newValue) {
        const update = { [updateKey]: field.newValue };

        // Update both the individual conversation and conversations list queries
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
}
