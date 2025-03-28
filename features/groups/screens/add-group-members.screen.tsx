import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo, useEffect } from "react"
import { Screen } from "@/components/screen/screen"
import { useAddGroupMembersStore } from "@/features/groups/stores/add-group-members.store"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { $globalStyles } from "@/theme/styles"
import { AddGroupMembersConfirmButton } from "../components/add-group-members-confirm-button.component"
import { AddGroupMembersSearchUsersResultsList } from "../components/add-group-members-search-results-list.component"
import { AddGroupMembersSearchUsersInput } from "../components/add-group-members-search-users-input.component"

export const AddGroupMembersScreen = memo(function AddGroupMembersScreen(
  props: NativeStackScreenProps<NavigationParamList, "AddGroupMembers">,
) {
  const router = useRouter()

  useHeader(
    {
      safeAreaEdges: ["top"],
      title: "Invite Members",
      leftIcon: "chevron.left",
      onBack: router.goBack,
      withBottomBorder: true,
    },
    [],
  )

  useEffect(() => {
    return () => {
      useAddGroupMembersStore.getState().actions.reset()
    }
  }, [])

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <AddGroupMembersSearchUsersInput />
      <AddGroupMembersSearchUsersResultsList />
      <AddGroupMembersConfirmButton />
    </Screen>
  )
})
