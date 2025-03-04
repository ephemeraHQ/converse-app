import { ConversationVersion } from "@xmtp/react-native-sdk"
import { IXmtpConversationWithCodecs, IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"

export function isConversationGroup(
  conversation: IXmtpConversationWithCodecs,
): conversation is IXmtpGroupWithCodecs {
  return conversation.version === ConversationVersion.GROUP
}
