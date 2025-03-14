import { IConversationTopic } from "@/features/conversation/conversation.types"
import { GroupDetailsScreen } from "@/features/groups/group-details/group-details.screen"
import { AppNativeStack } from "@/navigation/app-navigator"

export type GroupDetailsNavParams = {
  groupTopic: IConversationTopic
}

export const GroupDetailsScreenConfig = {
  path: "/group-details",
  parse: {
    conversationTopic: decodeURIComponent,
  },
  stringify: {
    conversationTopic: encodeURIComponent,
  },
}

export function GroupDetailsNav() {
  return <AppNativeStack.Screen name="GroupDetails" component={GroupDetailsScreen} />
}
