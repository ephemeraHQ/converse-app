import { IConversationBase } from "@/features/conversation/conversation.types"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export type IDm = IConversationBase & {
  type: "dm"
  peerInboxId: IXmtpInboxId
}
