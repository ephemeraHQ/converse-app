import { AddGroupMembersScreen } from "@/features/groups/group-details/add-group-members/add-group-members.screen"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { translate } from "@/i18n"
import { AppNativeStack } from "@/navigation/app-navigator"

export type AddGroupMembersNavParams = {
  xmtpConversationId: IXmtpConversationId
}

export const AddGroupMembersScreenConfig = {
  path: "/add-group-members",
  parse: {
    xmtpConversationId: decodeURIComponent,
  },
  stringify: {
    xmtpConversationId: encodeURIComponent,
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
