import { IXmtpDecodedMessage, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { xmtpLogger } from "@utils/logger"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

export const streamAllMessages = async (args: {
  inboxId: IXmtpInboxId
  onNewMessage: (message: IXmtpDecodedMessage) => Promise<void>
}) => {
  const { inboxId, onNewMessage } = args

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  xmtpLogger.debug(`Streaming messages for ${inboxId}`)

  try {
    await client.conversations.streamAllMessages(onNewMessage)
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
