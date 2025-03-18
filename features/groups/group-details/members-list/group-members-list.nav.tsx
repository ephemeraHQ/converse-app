import { GroupMembersListScreen } from "@/features/groups/group-details/members-list/group-members-list.screen"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { translate } from "@/i18n"
import { AppNativeStack } from "@/navigation/app-navigator"

export type GroupMembersListNavParams = {
  xmtpConversationId: IXmtpConversationId
}

export const GroupMembersListScreenConfig = {
  path: "/group-members-list",
  parse: {
    xmtpConversationId: decodeURIComponent,
  },
  stringify: {
    xmtpConversationId: encodeURIComponent,
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
