import { IXmtpDecodedMessage, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { xmtpLogger } from "@utils/logger"
import { XMTPError } from "@/utils/error"
import { isProd } from "@/utils/getEnv"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client.service"

export const streamAllMessages = async (args: {
  inboxId: IXmtpInboxId
  onNewMessage: (message: IXmtpDecodedMessage) => void | Promise<void>
}) => {
  const { inboxId, onNewMessage } = args

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  xmtpLogger.debug(`Streaming messages for ${inboxId}`)

  try {
    await client.conversations.streamAllMessages(async (message) => {
      xmtpLogger.debug(
        `Received message for ${inboxId} with id: ${message.id}, text: ${
          isProd ? "Redacted" : message.nativeContent.text
        }, topic: ${message.topic}`,
      )

      await onNewMessage(message)
    })
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to stream messages",
    })
  }
}

export const stopStreamingAllMessage = async (args: { inboxId: IXmtpInboxId }) => {
  const { inboxId } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId,
    })

    await client.conversations.cancelStreamAllMessages()

    xmtpLogger.debug(`Stopped streaming messages for ${inboxId}`)
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to cancel message streaming",
    })
  }
}
