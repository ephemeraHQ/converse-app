import { IConversation } from "@/features/conversation/conversation.types"
import { IGroup } from "@/features/groups/group.types"

export function isConversationGroup(conversation: IConversation): conversation is IGroup {
  return conversation.type === "group"
}
