import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { AddGroupMembersScreen } from "@/features/groups/group-details/add-group-members/add-group-members.screen"
import { translate } from "@/i18n"
import { AppNativeStack } from "@/navigation/app-navigator"

export type AddGroupMembersNavParams = {
  groupTopic: IXmtpConversationTopic
}

export const AddGroupMembersScreenConfig = {
  path: "/add-group-members",
  parse: {
    groupTopic: decodeURIComponent,
  },
  stringify: {
    groupTopic: encodeURIComponent,
  },
}

export function AddGroupMembersNav() {
  return (
    <AppNativeStack.Screen
      options={{
        title: translate("add_members"),
      }}
      name="AddGroupMembers"
      component={AddGroupMembersScreen}
    />
  )
}
