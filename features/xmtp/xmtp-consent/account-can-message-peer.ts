import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client.service"

export async function inboxIdCanMessageEthAddress(args: { inboxId: string; ethAddress: string }) {
  const { inboxId, ethAddress } = args

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  if (!client) {
    throw new Error("Client not found")
  }

  const canMessage = await client.canMessage([ethAddress])

  return canMessage[ethAddress.toLowerCase()]
}
