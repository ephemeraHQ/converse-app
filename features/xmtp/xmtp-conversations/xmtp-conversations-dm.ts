import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

export async function getXmtpDmByInboxId(args: {
  clientInboxId: IXmtpInboxId
  inboxId: IXmtpInboxId
}) {
  const { clientInboxId, inboxId } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    const conversation = await client.conversations.findDmByInboxId(inboxId)

    const duration = Date.now() - startTime
    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Getting conversation by inboxId took ${duration}ms for inboxId: ${inboxId}`,
          ),
        }),
      )
    }

    return conversation
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to get conversation for inbox ID: ${inboxId}`,
    })
  }
}

export async function createXmtpDm(args: {
  senderClientInboxId: IXmtpInboxId
  peerInboxId: IXmtpInboxId
}) {
  const { senderClientInboxId, peerInboxId } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: senderClientInboxId,
    })

    const startTime = Date.now()
    const conversation = await client.conversations.findOrCreateDm(peerInboxId)
    const endTime = Date.now()

    const duration = endTime - startTime
    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(`Creating DM took ${duration}ms for inboxId: ${peerInboxId}`),
        }),
      )
    }

    return conversation
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to create XMTP DM with inbox ID: ${peerInboxId}`,
    })
  }
}
