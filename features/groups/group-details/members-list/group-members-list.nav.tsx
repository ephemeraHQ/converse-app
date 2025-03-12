import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { GroupMembersListScreen } from "@/features/groups/group-details/members-list/group-members-list.screen"
import { translate } from "@/i18n"
import { AppNativeStack } from "@/navigation/app-navigator"

export type GroupMembersListNavParams = {
  groupTopic: IXmtpConversationTopic
}

export const GroupMembersListScreenConfig = {
  path: "/group-members-list",
  parse: {
    conversationTopic: decodeURIComponent,
  },
  stringify: {
    conversationTopic: encodeURIComponent,
  },
}

export function GroupMembersListNav() {
  return (
    <AppNativeStack.Screen
      options={{
        title: translate("group_members"),
      }}
      name="GroupMembersList"
      component={GroupMembersListScreen}
    />
  )
}
