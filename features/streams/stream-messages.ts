import { isGroupUpdatedMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { addMessageToConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { updateConversationQueryData } from "@/features/conversation/queries/conversation.query"
import {
  addGroupMemberToGroupQuery,
  removeGroupMemberToGroupQuery,
  updateGroupQueryData,
} from "@/features/groups/group.query"
import { IGroup } from "@/features/groups/group.types"
import { streamAllMessages } from "@/features/xmtp/xmtp-messages/xmtp-messages-stream"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { StreamError } from "@/utils/error"
import { streamLogger } from "@/utils/logger"
import {
  IConversationMessage,
  IConversationMessageGroupUpdated,
} from "../conversation/conversation-chat/conversation-message/conversation-message.types"
import { convertXmtpMessageToConvosMessage } from "../conversation/conversation-chat/conversation-message/utils/convert-xmtp-message-to-convos-message"
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

  // We're already handling message sent by current user with optimistic update
  if (message.senderInboxId === clientInboxId) {
    streamLogger.debug(
      `[handleNewMessage] message sent by current user, skipping updating query caches`,
    )
    return
  }

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
    addMessageToConversationMessagesQuery({
      clientInboxId,
      topic: message.topic,
      message,
    })
  } catch (error) {
    captureError(error)
  }

  try {
    updateConversationQueryData({
      clientInboxId,
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
      clientInboxId,
      topic: message.topic,
      conversationUpdate: {
        lastMessage: message,
      },
    })
  } catch (error) {
    captureError(error)
  }
}

// XMTP doesn't have typing yet
const METADATA_FIELD_MAP: Record<string, keyof IGroup> = {
  group_name: "name",
  group_image_url_square: "imageUrl",
  description: "description",
} as const

type MetadataField = keyof typeof METADATA_FIELD_MAP

function handleNewGroupUpdatedMessage(args: {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
  message: IConversationMessageGroupUpdated
}) {
  const { inboxId, topic, message } = args

  for (const member of message.content.membersAdded) {
    try {
      addGroupMemberToGroupQuery({
        clientInboxId: inboxId,
        topic,
        member: {
          inboxId: member.inboxId,
          consentState: "unknown",
          permission: "member",
        },
      })
    } catch (error) {
      captureError(error)
    }
  }

  for (const member of message.content.membersRemoved) {
    try {
      removeGroupMemberToGroupQuery({
        clientInboxId: inboxId,
        topic,
        memberInboxId: member.inboxId,
      })
    } catch (error) {
      captureError(error)
    }
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

        updateGroupQueryData({
          clientInboxId: inboxId,
          topic,
          updates: update,
        })

        updateConversationInAllowedConsentConversationsQueryData({
          clientInboxId: inboxId,
          topic,
          conversationUpdate: update,
        })
      }
    })
    return
  }
}
