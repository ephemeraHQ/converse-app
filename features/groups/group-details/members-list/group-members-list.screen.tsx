import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo, useCallback } from "react"
import { Screen } from "@/components/screen/screen"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"

export const GroupMembersListScreen = memo(function GroupMembersListScreen(
  props: NativeStackScreenProps<NavigationParamList, "GroupMembersList">,
) {
  const router = useRouter()

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
