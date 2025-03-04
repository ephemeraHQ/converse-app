import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { memo, useCallback, useEffect, useMemo } from "react"
import { TextStyle, ViewStyle } from "react-native"
import { Avatar } from "@/components/avatar"
import { GroupAvatar } from "@/components/group-avatar"
import { Screen } from "@/components/screen/screen"
import { Center } from "@/design-system/Center"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { HStack } from "@/design-system/HStack"
import { Icon } from "@/design-system/Icon/Icon"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { useGroupName } from "@/hooks/useGroupName"
import { useHeader } from "@/navigation/use-header"
import { useRouteParams, useRouter } from "@/navigation/use-navigation"
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery"
import { useAppTheme, type ThemedStyle } from "@/theme/use-app-theme"
import { getAccountIsAdmin } from "@/utils/groupUtils/adminUtils"
import { sortGroupMembersByAdminStatus } from "@/utils/groupUtils/sortGroupMembersByAdminStatus"

export const GroupDetailsScreen = memo(function GroupDetailsScreen() {
  const params = useRouteParams<"GroupDetails">()
  const currentAccount = useCurrentSenderEthAddress()!
  const { theme, themed } = useAppTheme()
  const router = useRouter()

  const conversationTopic = params?.conversationTopic as ConversationTopic

  const { groupName } = useGroupName({
    conversationTopic,
  })

  const { data: members } = useGroupMembersQuery({
    caller: "GroupDetailsScreen",
    account: currentAccount,
    topic: conversationTopic,
  })

  const sortedMembers = useMemo(() => {
    return sortGroupMembersByAdminStatus(members, currentAccount)
  }, [members, currentAccount])

  const memberCount = sortedMembers.length
  const memberText = `${memberCount} ${memberCount === 1 ? "member" : "members"}`

  const handleBackPress = useCallback(() => {
    router.goBack()
  }, [router])

  const handleSharePress = useCallback(() => {
    // TODO: Implement share functionality
    console.log("Share pressed")
  }, [])

  const handleEditPress = useCallback(() => {
    // TODO: Implement edit functionality
    console.log("Edit pressed")
  }, [])

  const handleMenuPress = useCallback(() => {
    // TODO: Implement menu functionality
    console.log("Menu pressed")
  }, [])

  const handleExitPress = useCallback(() => {
    // TODO: Implement exit group functionality
    console.log("Exit group pressed")
  }, [])

  const handleSeeAllPress = useCallback(() => {
    // TODO: Implement see all members functionality
    console.log("See all members pressed")
  }, [])

  // Set up header
  useHeader(
    {
      safeAreaEdges: ["top"],
      title: "Info",
      leftIcon: "chevron.left",
      onLeftPress: handleBackPress,
      RightActionComponent: (
        <HStack>
          <HeaderAction icon="square.and.arrow.up" onPress={handleSharePress} />
          <HeaderAction icon="pencil" onPress={handleEditPress} />
          <HeaderAction icon="more_vert" onPress={handleMenuPress} />
        </HStack>
      ),
    },
    [
      handleBackPress,
      handleSharePress,
      handleEditPress,
      handleMenuPress,
      theme,
    ],
  )

  if (!params?.conversationTopic) {
    return null
  }

  // For demo purposes, we'll show a limited number of members
  const visibleMembers = sortedMembers.slice(0, 6)
  const hasMoreMembers = sortedMembers.length > visibleMembers.length
  const remainingMembersCount = sortedMembers.length - visibleMembers.length

  return (
    <Screen preset="scroll">
      {/* Header Section with Avatar and Group Info */}
      <VStack style={themed($headerSection)}>
        <Center style={themed($avatarContainer)}>
          <GroupAvatar groupTopic={params.conversationTopic} size="lg" />
        </Center>

        <VStack style={themed($groupInfoContainer)}>
          <Text preset="title" style={$groupName}>
            {groupName}
          </Text>
          <Text preset="body" color="primary" style={$groupDescription}>
            Working towards the Bedrock milestone: world-class messaging on
            tomorrow's foundations (well underway)
          </Text>
          <Text preset="formLabel" color="secondary" style={$groupLink}>
            convos.com/convos-crew
          </Text>
        </VStack>
      </VStack>

      {/* Members Section */}
      <VStack style={themed($contentSection)}>
        <VStack style={themed($membersContainer)}>
          {/* Members Header */}
          <HStack style={themed($membersHeader)}>
            <Text preset="body" style={$membersTitle}>
              Members
            </Text>
            <Center style={themed($iconButton)}>
              <Text preset="body">+</Text>
            </Center>
          </HStack>

          {/* Members List */}
          <HStack style={themed($membersGrid)}>
            {visibleMembers.map((member, index) => {
              const isAdmin = getAccountIsAdmin(members, member.inboxId)
              const isSuperAdmin = index === 0 // For demo purposes, first member is super admin

              return (
                <VStack key={member.inboxId} style={themed($memberGridItem)}>
                  <Avatar
                    uri={null}
                    name={member.address}
                    size={theme.avatarSize.md}
                    style={themed($memberGridAvatar)}
                  />
                  <Text
                    preset="formLabel"
                    numberOfLines={1}
                    style={$memberAddress}
                  >
                    {member.address.slice(0, 8)}
                  </Text>
                  {(isAdmin || isSuperAdmin) && (
                    <Text
                      preset="formLabel"
                      color="secondary"
                      style={$adminBadge}
                    >
                      {isSuperAdmin ? "Admin" : "Admin"}
                    </Text>
                  )}
                </VStack>
              )
            })}

            {hasMoreMembers && (
              <VStack style={themed($memberGridItem)}>
                <Center style={themed($remainingMembersAvatar)}>
                  <Text preset="body" style={$remainingMembersText}>
                    +{remainingMembersCount}
                  </Text>
                </Center>
                <Pressable
                  onPress={handleSharePress}
                  style={themed($shareButton)}
                >
                  <Icon
                    picto="square.and.arrow.up"
                    size={theme.iconSize.sm}
                    color={theme.colors.fill.primary}
                  />
                </Pressable>
              </VStack>
            )}
          </HStack>

          {/* See All Button */}
          {hasMoreMembers && (
            <Pressable
              onPress={handleSeeAllPress}
              style={themed($seeAllButton)}
            >
              <HStack style={$seeAllContent}>
                <Text preset="body">See all {memberCount}</Text>
                <Text preset="body" color="secondary" style={$chevronIcon}>
                  →
                </Text>
              </HStack>
            </Pressable>
          )}
        </VStack>

        {/* Exit Button */}
        <Pressable onPress={handleExitPress} style={themed($exitButton)}>
          <Text preset="body" color="caution" style={$exitText}>
            Exit
          </Text>
        </Pressable>
      </VStack>
    </Screen>
  )
})

// Define styles outside the component with $ prefix
const $headerSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingBottom: spacing.lg,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.background.surface,
  alignItems: "center",
  justifyContent: "center",
})

const $avatarContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.md,
})

const $groupInfoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.xs,
})

const $groupName: TextStyle = {
  textAlign: "center",
}

const $groupDescription: TextStyle = {
  textAlign: "center",
}

const $groupLink: TextStyle = {
  textAlign: "center",
}

const $contentSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background.sunken,
  paddingVertical: spacing.xs,
  gap: spacing.xs,
})

const $membersContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.surface,
})

const $membersHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  justifyContent: "space-between",
  alignItems: "center",
})

const $membersTitle: TextStyle = {
  // No font styling needed, using preset
}

const $iconButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  justifyContent: "center",
  alignItems: "center",
})

const $membersGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  gap: spacing.md,
})

const $memberGridItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  width: 60,
  gap: spacing.xs,
})

const $memberGridAvatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.fill.tertiary,
})

const $memberAddress: TextStyle = {
  textAlign: "center",
}

const $adminBadge: TextStyle = {
  textAlign: "center",
}

const $remainingMembersAvatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.fill.secondary,
  justifyContent: "center",
  alignItems: "center",
})

const $shareButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xs,
  padding: spacing.xs,
  borderRadius: 16,
  backgroundColor: colors.background.surface,
})

const $memberItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  backgroundColor: colors.background.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.border.subtle,
  alignItems: "center",
  gap: spacing.sm,
})

const $memberAvatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.text.secondary,
  justifyContent: "center",
  alignItems: "center",
})

const $memberInfo: ViewStyle = {
  flex: 1,
}

const $seeAllButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  backgroundColor: colors.background.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.border.subtle,
})

const $seeAllContent: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $chevronIcon: TextStyle = {
  // No font styling needed, using color prop
}

const $exitButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  backgroundColor: colors.background.surface,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: colors.border.subtle,
})

const $exitText: TextStyle = {
  textAlign: "center",
}

const $remainingMembersText: TextStyle = {
  color: "#FFFFFF", // Using hex color directly instead of "white"
}
