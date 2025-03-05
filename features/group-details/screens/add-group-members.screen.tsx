import { memo, useCallback, useState } from "react"
import { ViewStyle } from "react-native"
import { Screen } from "@/components/screen/screen"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { TextInput } from "@/design-system/text-input"
import { VStack } from "@/design-system/VStack"
import { useAddGroupMembers } from "@/features/group-details/hooks/use-add-group-members"
import { useHeader } from "@/navigation/use-header"
import { useRouteParams, useRouter } from "@/navigation/use-navigation"
import { useAppTheme, type ThemedStyle } from "@/theme/use-app-theme"

export const AddGroupMembersScreen = memo(function AddGroupMembersScreen() {
  const params = useRouteParams<"AddGroupMembers">()
  const router = useRouter()
  const { theme, themed } = useAppTheme()
  const [searchQuery, setSearchQuery] = useState("")

  useAddGroupMembers()

  // Set up header
  useHeader(
    {
      safeAreaEdges: ["top"],
      title: "Add Members",
      leftIcon: "chevron.left",
      onBack: router.goBack,
      // RightActionComponent: selectedContacts.length > 0 && (
      //   <HeaderAction
      //     label={`Add (${selectedContacts.length})`}
      //     onPress={handleAddMembers}
      //     isLoading={isLoading}
      //   />
      // ),
    },
    [],
  )

  return (
    <Screen preset="fixed">
      <VStack style={themed($container)}>
        <TextInput
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </VStack>
    </Screen>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.lg,
  gap: spacing.md,
})

const $searchInput: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $contactList: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})
