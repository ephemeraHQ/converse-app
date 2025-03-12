import { xmtpLogger } from "@utils/logger"
import { InboxId } from "@xmtp/react-native-sdk"
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client.service"

export async function streamConversations(args: {
  inboxId: InboxId
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

export async function stopStreamingConversations(args: { inboxId: InboxId }) {
  const { inboxId } = args

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  await client.conversations.cancelStream()

  xmtpLogger.debug(`Stopped streaming conversations for ${inboxId}`)
}
