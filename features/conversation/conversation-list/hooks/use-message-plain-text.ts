import { GroupUpdatedCodec } from "@xmtp/react-native-sdk"
import { useMemo } from "react"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import {
  isGroupUpdatedMessage,
  isMultiRemoteAttachmentMessage,
  isReactionMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTextMessage,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import logger from "@/utils/logger"

// Handles group metadata changes (name, description, image)
function handleGroupMetadataChange(args: {
  initiatorName: string
  content: ReturnType<GroupUpdatedCodec["decode"]>
}) {
  const { initiatorName, content } = args

  if (content.metadataFieldsChanged.length !== 1) {
    return `${initiatorName} updated the group`
  }

  const change = content.metadataFieldsChanged[0]

  switch (change.fieldName) {
    case "group_name":
      return `${initiatorName} changed group name to ${change.newValue}`
    case "description":
      return `${initiatorName} changed description to ${change.newValue}`
    case "group_image_url_square":
      return `${initiatorName} changed group image`
    default:
      return `${initiatorName} updated the group`
  }
}

export function useMessagePlainText(message: IXmtpDecodedMessage | undefined) {
  const account = useCurrentSenderEthAddress()

  // Get initiator profile for group updates
  const initiatorInboxId =
    message && isGroupUpdatedMessage(message) ? message.content().initiatedByInboxId : undefined

  const { displayName: initiatorDisplayName } = usePreferredDisplayInfo({
    inboxId: initiatorInboxId,
  })

  // Get member profiles for group updates - split into added and removed
  const { addedMemberInboxIds, removedMemberInboxIds } = useMemo(() => {
    if (!message || !isGroupUpdatedMessage(message)) {
      return { addedMemberInboxIds: [], removedMemberInboxIds: [] }
    }
    const content = message.content()
    return {
      addedMemberInboxIds: content.membersAdded.map((m) => m.inboxId),
      removedMemberInboxIds: content.membersRemoved.map((m) => m.inboxId),
    }
  }, [message])

  const addedMemberDisplayInfos = usePreferredDisplayInfoBatch({
    xmtpInboxIds: addedMemberInboxIds,
  })

  const removedMemberDisplayInfos = usePreferredDisplayInfoBatch({
    xmtpInboxIds: removedMemberInboxIds,
  })

  return useMemo(() => {
    if (!account || !message) {
      return ""
    }

    try {
      // Handle reply messages
      if (isReplyMessage(message)) {
        const content = message.content()
        return typeof content === "string" ? content : content.content.text
      }

      // Handle attachment messages
      if (isStaticAttachmentMessage(message) || isRemoteAttachmentMessage(message)) {
        return "Attachment"
      }

      // Handle group update messages
      if (isGroupUpdatedMessage(message)) {
        const content = message.content()
        const initiatorName = initiatorDisplayName ?? "Someone"

        // Handle metadata changes
        if (content.metadataFieldsChanged.length > 0) {
          return handleGroupMetadataChange({
            initiatorName,
            content,
          })
        }

        // Handle member changes
        if (content.membersAdded.length > 0) {
          const memberName = addedMemberDisplayInfos?.[0]?.displayName ?? "someone"
          return content.membersAdded.length === 1
            ? `${initiatorName} added ${memberName}`
            : `${initiatorName} added ${content.membersAdded.length} members`
        }

        if (content.membersRemoved.length > 0) {
          const memberName = removedMemberDisplayInfos?.[0]?.displayName ?? "someone"
          return content.membersRemoved.length === 1
            ? `${initiatorName} removed ${memberName}`
            : `${initiatorName} removed ${content.membersRemoved.length} members`
        }

        return "Group updated"
      }

      if (isTextMessage(message)) {
        const content = message.content()
        return typeof content === "string" ? content : message.fallback
      }

      if (isMultiRemoteAttachmentMessage(message)) {
        return "Attachment"
      }

      if (isReactionMessage(message)) {
        return "Reaction"
      }

      const _ensureNever: never = message
    } catch (error) {
      captureError(error)
      return message.fallback
    }
  }, [message, account, initiatorDisplayName, addedMemberDisplayInfos, removedMemberDisplayInfos])
}
