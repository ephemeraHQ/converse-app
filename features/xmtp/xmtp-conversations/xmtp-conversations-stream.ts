import { IXmtpConversationWithCodecs, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { xmtpLogger } from "@utils/logger"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

export async function streamConversations(args: {
  inboxId: IXmtpInboxId
  onNewConversation: (conversation: IXmtpConversationWithCodecs) => void | Promise<void>
}) {
  const { inboxId, onNewConversation } = args

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  xmtpLogger.debug(`Started streaming conversations for ${inboxId}`)

  await client.conversations.stream(async (conversation) => {
    xmtpLogger.debug(`Received new conversation for ${inboxId}`)
    onNewConversation(conversation)
  })
}

export async function stopStreamingConversations(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  await client.conversations.cancelStream()

  xmtpLogger.debug(`Stopped streaming conversations for ${inboxId}`)
}
