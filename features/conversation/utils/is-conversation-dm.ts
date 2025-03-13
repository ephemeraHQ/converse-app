import { ConversationVersion } from "@xmtp/react-native-sdk"
import { IDm } from "@/features/dm/dm.types"
import { IConversation } from "../conversation.types"

export function isConversationDm(conversation: IConversation): conversation is IDm {
  return conversation.version === ConversationVersion.DM
}
