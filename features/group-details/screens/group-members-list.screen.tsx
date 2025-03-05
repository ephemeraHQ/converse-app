import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo, useCallback, useState } from "react"
import { ViewStyle } from "react-native"
import { Avatar } from "@/components/avatar"
import { Screen } from "@/components/screen/screen"
import { HStack } from "@/design-system/HStack"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { TextInput } from "@/design-system/text-input"
import { VStack } from "@/design-system/VStack"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery"
import { useAppTheme, type ThemedStyle } from "@/theme/use-app-theme"
import { getAccountIsAdmin } from "@/utils/groupUtils/adminUtils"
import { sortGroupMembersByAdminStatus } from "@/utils/groupUtils/sortGroupMembersByAdminStatus"

export const GroupMembersListScreen = memo(function GroupMembersListScreen(
  props: NativeStackScreenProps<NavigationParamList, "GroupMembersList">,
) {
  const { conversationTopic } = props.route.params
  const router = useRouter()
  const { theme, themed } = useAppTheme()
  const currentAccount = useCurrentSenderEthAddress()!
  const [searchQuery, setSearchQuery] = useState("")

  const { data: members } = useGroupMembersQuery({
    caller: "GroupMembersListScreen",
    account: currentAccount,
    topic: conversationTopic,
  })

  const sortedMembers = sortGroupMembersByAdminStatus(members, currentAccount)

  const filteredMembers = sortedMembers.filter((member) =>
    member.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleBackPress = useCallback(() => {
    router.goBack()
  }, [router])

  const handleMemberPress = useCallback(
    (memberInboxId: string) => {
      const isAdmin = getAccountIsAdmin(members, memberInboxId)
      if (isAdmin) {
        // TODO: Implement admin actions
        console.log("Admin member pressed:", memberInboxId)
      } else {
        router.push("Profile", { inboxId: memberInboxId })
      }
    },
    [members, router],
  )

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

  return (
    <Screen preset="fixed">
      <VStack style={themed($container)}>
        <TextInput
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <VStack style={themed($membersList)}>
          {filteredMembers.map((member) => {
            const isAdmin = getAccountIsAdmin(members, member.inboxId)
            const isSuperAdmin = member === sortedMembers[0]

            return (
              <Pressable
                key={member.inboxId}
                onPress={() => handleMemberPress(member.inboxId)}
                style={themed($memberItem)}
              >
                <HStack style={themed($memberContent)}>
                  <Avatar
                    uri={null}
                    name={member.address}
                    size="md"
                    style={themed($memberAvatar)}
                  />
                  <VStack style={$memberInfo}>
                    <Text preset="body" numberOfLines={1}>
                      {member.address}
                    </Text>
                    {(isAdmin || isSuperAdmin) && (
                      <Text preset="formLabel" color="secondary">
                        {isSuperAdmin ? "Admin" : "Admin"}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Pressable>
            )
          })}
        </VStack>
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

const $membersList: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  gap: spacing.sm,
})

const $memberItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.sm,
  backgroundColor: colors.background.surface,
  borderRadius: 8,
})

const $memberContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.sm,
})

const $memberAvatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.fill.tertiary,
})

const $memberInfo: ViewStyle = {
  flex: 1,
}
