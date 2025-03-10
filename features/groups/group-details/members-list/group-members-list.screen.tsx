import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo, useCallback } from "react"
import { Screen } from "@/components/screen/screen"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { useGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"

export const GroupMembersListScreen = memo(function GroupMembersListScreen(
  props: NativeStackScreenProps<NavigationParamList, "GroupMembersList">,
) {
  const { groupTopic: conversationTopic } = props.route.params
  const router = useRouter()
  const currentAccount = useCurrentSenderEthAddress()!

  const { data: members } = useGroupMembersQuery({
    caller: "GroupMembersListScreen",
    account: currentAccount,
    topic: conversationTopic,
  })

  const handleBackPress = useCallback(() => {
    router.goBack()
  }, [router])

  // Set up header
  useHeader(
    {
      safeAreaEdges: ["top"],
      title: "Group Members",
      leftIcon: "chevron.left",
      onLeftPress: handleBackPress,
    },
    [handleBackPress],
  )

  return <Screen preset="fixed"></Screen>
})
