import { isGroupUpdatedMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { addMessageToConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { updateConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { IGroup } from "@/features/groups/group.types"
import {
  addGroupMemberToGroupQueryData,
  removeGroupMemberToGroupQuery,
  updateGroupQueryData,
} from "@/features/groups/queries/group.query"
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

  streamLogger.debug(`New message:`, message)

  const messageWasSentByCurrentUser = message.senderInboxId === clientInboxId

  if (isGroupUpdatedMessage(message)) {
    try {
      handleNewGroupUpdatedMessage({
        inboxId: clientInboxId,
        message,
      })
    } catch (error) {
      captureError(
        new StreamError({ error, additionalMessage: "Error handling new group updated message" }),
      )
    }
  }

  try {
    // Because we handle the message sent by current user with optimistic update, we don't need to update the query cache
    if (!messageWasSentByCurrentUser) {
      addMessageToConversationMessagesQueryData({
        clientInboxId,
        xmtpConversationId: message.xmtpConversationId,
        message,
      })
    }
  } catch (error) {
    captureError(new StreamError({ error, additionalMessage: "Error handling new message" }))
  }

  try {
    updateConversationQueryData({
      clientInboxId,
      xmtpConversationId: message.xmtpConversationId,
      conversationUpdate: {
        lastMessage: message,
      },
    })
  } catch (error) {
    captureError(
      new StreamError({ error, additionalMessage: "Error updating conversation query data" }),
    )
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
  message: IConversationMessageGroupUpdated
}) {
  const { inboxId, message } = args

  for (const member of message.content.membersAdded) {
    addGroupMemberToGroupQueryData({
      clientInboxId: inboxId,
      xmtpConversationId: message.xmtpConversationId,
      member: {
        inboxId: member.inboxId,
        consentState: "unknown",
        permission: "member",
      },
    }).catch(captureError)
  }

  for (const member of message.content.membersRemoved) {
    removeGroupMemberToGroupQuery({
      clientInboxId: inboxId,
      xmtpConversationId: message.xmtpConversationId,
      memberInboxId: member.inboxId,
    }).catch(captureError)
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
          xmtpConversationId: message.xmtpConversationId,
          updates: update,
        })
      }
    })
    return
  }
}
