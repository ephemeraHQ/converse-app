import {
  convertXmtpMessageToConvosMessage,
  isGroupUpdatedMessage,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { addConversationMessageQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { updateConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { refetchGroupMembersQuery } from "@/features/groups/group-members.query"
import { streamAllMessages } from "@/features/xmtp/xmtp-messages/xmtp-messages-stream"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { StreamError } from "@/utils/error"
import { streamLogger } from "@/utils/logger"
import {
  IConversationMessage,
  IConversationMessageGroupUpdated,
} from "../conversation/conversation-chat/conversation-message/conversation-message.types"
import { IConversationTopic } from "../conversation/conversation.types"

export async function startMessageStreaming(args: { clientInboxId: IXmtpInboxId }) {
  const { clientInboxId } = args

  try {
    await streamAllMessages({
      inboxId: clientInboxId,
      onNewMessage: (message) =>
        handleNewMessage({ clientInboxId, message: convertXmtpMessageToConvosMessage(message) }),
    })
  } catch (error) {
    throw new StreamError({
      error,
      additionalMessage: `Failed to stream messages for ${clientInboxId}`,
    })
  }
}

async function handleNewMessage(args: {
  clientInboxId: IXmtpInboxId
  message: IConversationMessage
}) {
  const { clientInboxId, message } = args

  streamLogger.debug(`[handleNewMessage] message: ${JSON.stringify(message)}`)

  if (isGroupUpdatedMessage(message)) {
    try {
      handleNewGroupUpdatedMessage({
        inboxId: clientInboxId,
        topic: message.topic,
        message,
      })
    } catch (error) {
      captureError(error)
    }
  }

  try {
    addConversationMessageQuery({
      clientInboxId,
      topic: message.topic,
      message,
    })
  } catch (error) {
    captureError(error)
  }

  try {
    updateConversationQueryData({
      inboxId: clientInboxId,
      topic: message.topic,
      conversationUpdate: {
        lastMessage: message,
      },
    })
  } catch (error) {
    captureError(error)
  }

  try {
    updateConversationInAllowedConsentConversationsQueryData({
      inboxId: clientInboxId,
      topic: message.topic,
      conversationUpdate: {
        lastMessage: message,
      },
    })
  } catch (error) {
    captureError(error)
  }
}

const METADATA_FIELD_MAP = {
  group_name: "name",
  group_image_url_square: "groupImageUrl",
  description: "description",
} as const

type MetadataField = keyof typeof METADATA_FIELD_MAP

function handleNewGroupUpdatedMessage(args: {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
  message: IConversationMessageGroupUpdated
}) {
  const { inboxId, topic, message } = args

  // Handle member changes by refetching the group members
  if (message.content.membersAdded.length > 0 || message.content.membersRemoved.length > 0) {
    refetchGroupMembersQuery({ clientInboxId: inboxId, topic }).catch(captureError)
  }

  // Process metadata changes (e.g., group name, image, description)
  if (message.content.metadataFieldsChanged.length > 0) {
    message.content.metadataFieldsChanged.forEach((field) => {
      const fieldName = field.fieldName as MetadataField

      // Validate that the field is supported
      if (!(fieldName in METADATA_FIELD_MAP)) {
        captureError(new Error(`Unsupported metadata field name: ${fieldName}`))
        return
      }

      // Map the field name to our internal property name and update if there's a new value
      const updateKey = METADATA_FIELD_MAP[fieldName]
      if (updateKey && field.newValue) {
        const update = { [updateKey]: field.newValue }

        // Update both the individual conversation and conversations list queries
        updateConversationQueryData({
          inboxId,
          topic,
          conversationUpdate: update,
        })

        updateConversationInAllowedConsentConversationsQueryData({
          inboxId,
          topic,
          conversationUpdate: update,
        })
      }
    })
    return
  }
}
