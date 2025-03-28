import { conversationMessages, findMessage, processMessage } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import {
  ISupportedXmtpCodecs,
  isXmtpGroupUpdatedContentType,
  isXmtpMultiRemoteAttachmentContentType,
  isXmtpReactionContentType,
  isXmtpReadReceiptContentType,
  isXmtpRemoteAttachmentContentType,
  isXmtpReplyContentType,
  isXmtpStaticAttachmentContentType,
  isXmtpTextContentType,
} from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { logErrorIfXmtpRequestTookTooLong } from "@/features/xmtp/xmtp.helpers"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import {
  IXmtpConversationId,
  IXmtpDecodedGroupUpdatedMessage,
  IXmtpDecodedMessage,
  IXmtpDecodedMultiRemoteAttachmentMessage,
  IXmtpDecodedReactionMessage,
  IXmtpDecodedRemoteAttachmentMessage,
  IXmtpDecodedReplyMessage,
  IXmtpDecodedStaticAttachmentMessage,
  IXmtpDecodedTextMessage,
  IXmtpInboxId,
  IXmtpMessageId,
} from "../xmtp.types"

function isSupportedXmtpMessage(message: IXmtpDecodedMessage) {
  if (isXmtpReadReceiptContentType(message.contentTypeId)) {
    return false
  }

  return true
}

function xmtpMessageGroupUpdatedContentIsEmpty(message: IXmtpDecodedGroupUpdatedMessage) {
  const content = message.content()
  return (
    content.membersAdded.length === 0 &&
    content.membersRemoved.length === 0 &&
    content.metadataFieldsChanged.length === 0
  )
}

export async function getXmtpConversationMessages(args: {
  clientInboxId: IXmtpInboxId
  conversationId: IXmtpConversationId
  limit?: number
}) {
  const { clientInboxId, conversationId, limit = 30 } = args

  try {
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: clientInboxId,
    })

    const beforeMs = new Date().getTime()
    const messages = await conversationMessages<ISupportedXmtpCodecs>(
      installationId,
      conversationId,
      limit,
    )
    const afterMs = new Date().getTime()

    const timeDiffMs = afterMs - beforeMs
    if (timeDiffMs > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Fetching conversation messages took ${timeDiffMs}ms for conversationId ${conversationId}`,
          ),
        }),
      )
    }

    return messages.filter((message) => {
      // Shouldn't need this but just to make sure
      if (!isSupportedXmtpMessage(message)) {
        return false
      }

      // For some reason, XMTP returns group updated messages with empty content...
      if (
        isXmtpGroupUpdatedContentType(message.contentTypeId) &&
        xmtpMessageGroupUpdatedContentIsEmpty(message as IXmtpDecodedGroupUpdatedMessage)
      ) {
        return false
      }

      return true
    })
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error fetching messages for conversationId ${conversationId}`,
    })
  }
}

export async function getXmtpConversationMessage(args: {
  messageId: IXmtpMessageId
  clientInboxId: IXmtpInboxId
}) {
  const { messageId, clientInboxId } = args
  try {
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: clientInboxId,
    })

    const beforeMs = new Date().getTime()
    const message = await findMessage(installationId, messageId)
    const afterMs = new Date().getTime()

    logErrorIfXmtpRequestTookTooLong({
      durationMs: afterMs - beforeMs,
      xmtpFunctionName: `findMessage`,
    })

    return message
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error finding message ${messageId}`,
    })
  }
}

export async function decryptXmtpMessage(args: {
  encryptedMessage: string
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
}) {
  const { encryptedMessage, xmtpConversationId, clientInboxId } = args

  try {
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: clientInboxId,
    })

    const beforeMs = new Date().getTime()
    const message = await processMessage(installationId, xmtpConversationId, encryptedMessage)
    const afterMs = new Date().getTime()

    const timeDiffMs = afterMs - beforeMs
    if (timeDiffMs > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(`Decrypting message took ${timeDiffMs}ms`),
        }),
      )
    }

    return message
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error decrypting message for conversation ${xmtpConversationId}`,
    })
  }
}

export function getXmtpMessageIsTextMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedTextMessage {
  return isXmtpTextContentType(message.contentTypeId)
}

export function getXmtpMessageIsReactionMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedReactionMessage {
  return isXmtpReactionContentType(message.contentTypeId)
}

export function getXmtpMessageIsReplyMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedReplyMessage {
  return isXmtpReplyContentType(message.contentTypeId)
}

export function getXmtpMessageIsGroupUpdatedMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedGroupUpdatedMessage {
  return isXmtpGroupUpdatedContentType(message.contentTypeId)
}

export function getXmtpMessageIsMultiRemoteAttachmentMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedMultiRemoteAttachmentMessage {
  return isXmtpMultiRemoteAttachmentContentType(message.contentTypeId)
}

export function getXmtpMessageIsStaticAttachmentMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedStaticAttachmentMessage {
  return isXmtpStaticAttachmentContentType(message.contentTypeId)
}

export function getXmtpMessageIsRemoteAttachmentMessage(
  message: IXmtpDecodedMessage,
): message is IXmtpDecodedRemoteAttachmentMessage {
  return isXmtpRemoteAttachmentContentType(message.contentTypeId)
}
