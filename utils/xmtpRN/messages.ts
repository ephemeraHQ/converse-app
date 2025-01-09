import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { updateConversationQueryData } from "@/queries/useConversationQuery";
import { invalidateGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { addConversationMessage } from "@queries/useConversationMessages";
import logger from "@utils/logger";
import type {
  ConversationTopic,
  GroupUpdatedContent,
  InboxId,
} from "@xmtp/react-native-sdk";
import { isProd } from "@/utils/getEnv";
import { DecodedMessageWithCodecsType } from "./client.types";
import { getXmtpClientOrThrow } from "@/features/Accounts/accounts.utils";
import { updateConversationInConversationListQuery } from "@/queries/useConversationListQuery";

export const streamAllMessages = async ({ inboxId }: { inboxId: InboxId }) => {
  await stopStreamingAllMessage({ inboxId });

  const client = getXmtpClientOrThrow({
    inboxId,
    caller: "streamAllMessages",
  });

  logger.info(
    `[XmtpRN] Streaming messages for address=${client.address} inboxId=${inboxId}`
  );

  await client.conversations.streamAllMessages(async (message) => {
    logger.info(`[XmtpRN] Received a message for ${client.address}`, {
      id: message.id,
      text: isProd ? "Redacted" : message.nativeContent.text,
      topic: message.topic,
    });

    if (message.contentTypeId.includes("group_updated")) {
      try {
        await handleGroupUpdatedMessage({
          inboxId: client.inboxId,
          topic: message.topic as ConversationTopic,
          message,
        });
      } catch (error) {
        captureError(error);
      }
    }

    // We already handle text messages from the current user locally via react-query.
    // Doing this for optimistic updates.
    // We only need to handle messages that are either:
    // 1. From other users
    // 2. Non-text messages from current user
    const isMessageFromOtherUser = !messageIsFromCurrentAccountInboxId({
      message,
    });
    const isNonTextMessage = !isTextMessage(message);
    if (isMessageFromOtherUser || isNonTextMessage) {
      try {
        addConversationMessage({
          inboxId: client.inboxId,
          topic: message.topic as ConversationTopic,
          message,
        });
      } catch (error) {
        captureError(error);
      }
    }

    try {
      updateConversationQueryData({
        inboxId: client.inboxId,
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
        inboxId: client.inboxId,
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

export const stopStreamingAllMessage = async ({
  inboxId,
}: {
  inboxId: InboxId;
}) => {
  const client = getXmtpClientOrThrow({
    inboxId,
    caller: "stopStreamingAllMessage",
  });
  logger.debug(`[XmtpRN] Stopped streaming messages for ${client.address}`);
  client.conversations.cancelStreamAllMessages();
};

export const handleGroupUpdatedMessage = async ({
  inboxId,
  topic,
  message,
}: {
  inboxId: InboxId;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) => {
  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    // This will refresh members
    invalidateGroupMembersQuery({ inboxId, topic });
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
        inboxId,
        topic,
        conversationUpdate: {
          name: newGroupName,
        },
      });
      updateConversationInConversationListQuery({
        inboxId,
        topic,
        conversationUpdate: {
          name: newGroupName,
        },
      });
    }
    if (!!newGroupPhotoUrl) {
      updateConversationQueryData({
        inboxId,
        topic,
        conversationUpdate: {
          imageUrlSquare: newGroupPhotoUrl,
        },
      });
      updateConversationInConversationListQuery({
        inboxId,
        topic,
        conversationUpdate: {
          imageUrlSquare: newGroupPhotoUrl,
        },
      });
    }
    if (!!newGroupDescription) {
      updateConversationQueryData({
        inboxId,
        topic,
        conversationUpdate: {
          description: newGroupDescription,
        },
      });
      updateConversationInConversationListQuery({
        inboxId,
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
    invalidateGroupMembersQuery({ inboxId, topic });
  }
};
