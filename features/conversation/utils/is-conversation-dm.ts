import { IDm } from "@/features/dm/dm.types"
import { IConversation } from "../conversation.types"

export function isConversationDm(conversation: IConversation): conversation is IDm {
  return conversation.type === "dm"
}
