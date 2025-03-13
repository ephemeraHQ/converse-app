import { IConversation } from "@/features/conversation/conversation.types"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export type IDm = IConversation & {
  type: "dm"
  peerInboxId: IXmtpInboxId
}
