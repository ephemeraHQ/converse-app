import { ConversationTopic, GroupUpdatedContent, InboxId } from "@xmtp/react-native-sdk"
import { addConversationMessageQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { updateConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { refetchGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"
import { streamAllMessages } from "@/features/xmtp/xmtp-messages/xmtp-messages-stream"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { StreamError } from "@/utils/error"
import { streamLogger } from "@/utils/logger"

export async function startMessageStreaming(args: { clientInboxId: InboxId }) {
  const { clientInboxId } = args

  try {
    await streamAllMessages({
      inboxId: clientInboxId,
      onNewMessage: (message) => handleNewMessage({ clientInboxId, message }),
    })
  } catch (error) {
    throw new StreamError({
      error,
      additionalMessage: `Failed to stream messages for ${clientInboxId}`,
    })
  }
}

async function handleNewMessage(args: { clientInboxId: InboxId; message: IXmtpDecodedMessage }) {
  const { clientInboxId, message } = args

  streamLogger.debug(`[handleNewMessage] message: ${JSON.stringify(message)}`)

  if (message.contentTypeId.includes("group_updated")) {
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
      topic: message.topic as ConversationTopic,
      message,
    })
  } catch (error) {
    captureError(error)
  }

  try {
    updateConversationQueryData({
      inboxId: clientInboxId,
      topic: message.topic as ConversationTopic,
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
      topic: message.topic as ConversationTopic,
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
  inboxId: InboxId
  topic: ConversationTopic
  message: IXmtpDecodedMessage
}) {
  const { inboxId, topic, message } = args

  // Early return if not a group update message
  if (!message.contentTypeId.includes("group_updated")) return
  const content = message.content() as GroupUpdatedContent

  // Handle member changes by refetching the group members
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    refetchGroupMembersQuery({ clientInboxId: inboxId, topic }).catch(captureError)
    return
  }

  // Process metadata changes (e.g., group name, image, description)
  if (content.metadataFieldsChanged.length > 0) {
    content.metadataFieldsChanged.forEach((field) => {
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
