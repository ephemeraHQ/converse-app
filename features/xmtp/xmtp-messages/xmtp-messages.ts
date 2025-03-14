import { conversationMessages, findMessage } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client.service"
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

export function isSupportedMessage(message: IXmtpDecodedMessage) {
  if (isXmtpReadReceiptContentType(message.contentTypeId)) {
    return false
  }

  return true
}

export async function getXmtpConversationMessages(args: {
  clientInboxId: IXmtpInboxId
  conversationId: IXmtpConversationId
  limit?: number
}) {
  const { clientInboxId, conversationId, limit = 30 } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const beforeMs = new Date().getTime()
    const messages = await conversationMessages<ISupportedXmtpCodecs>(
      client.installationId,
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

    return messages
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
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const beforeMs = new Date().getTime()
    const message = await findMessage(client.installationId, messageId)
    const afterMs = new Date().getTime()

    const timeDiffMs = afterMs - beforeMs
    if (timeDiffMs > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(`Finding message ${messageId} took ${timeDiffMs}ms`),
        }),
      )
    }

    return message
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error finding message ${messageId}`,
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
