import { ConversationTopic } from "@xmtp/react-native-sdk"
import { AddGroupMembersScreen } from "@/features/group-details/screens/add-group-members.screen"
import { translate } from "@/i18n"
import { AppNativeStack } from "@/navigation/app-navigator"

export type AddGroupMembersNavParams = {
  groupTopic: ConversationTopic
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
