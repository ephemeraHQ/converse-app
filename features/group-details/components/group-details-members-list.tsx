import { ConversationTopic } from "@xmtp/react-native-sdk"
import { memo, useCallback, useMemo } from "react"
import { ListItem } from "@/components/list-item"
import { Center } from "@/design-system/Center"
import { HStack } from "@/design-system/HStack"
import { Icon } from "@/design-system/Icon/Icon"
import { IconButton } from "@/design-system/IconButton/IconButton"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { GroupDetailsListItem } from "@/features/group-details/components/group-details.ui"
import { useRouter } from "@/navigation/use-navigation"
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery"
import { useAppTheme } from "@/theme/use-app-theme"
import { debugBorder } from "@/utils/debug-style"
import { getAccountIsAdmin } from "@/utils/groupUtils/adminUtils"
import { sortGroupMembersByAdminStatus } from "@/utils/groupUtils/sortGroupMembersByAdminStatus"
import { MemberListItem } from "./group-details-members-list-item"

export const MembersList = memo(function MembersList(props: { topic: ConversationTopic }) {
  const { topic } = props
  const router = useRouter()
  const { theme } = useAppTheme()
  const currentSenderEthAddress = useCurrentSenderEthAddress()!

  const { data: members } = useGroupMembersQuery({
    caller: "GroupDetailsScreen",
    account: currentSenderEthAddress,
    topic,
  })

  const sortedMembers = useMemo(() => {
    return sortGroupMembersByAdminStatus(members, currentSenderEthAddress)
  }, [members, currentSenderEthAddress])

  const handleAddMembersPress = useCallback(() => {
    router.push("AddGroupMembers", { groupTopic: topic })
  }, [topic, router])

  const handleSeeAllPress = useCallback(() => {
    router.push("GroupMembersList", { conversationTopic: topic })
  }, [topic, router])

  // For demo purposes, we'll show a limited number of members
  const visibleMembers = sortedMembers.slice(0, 6)
  const hasMoreMembers = sortedMembers.length > visibleMembers.length
  const remainingMembersCount = sortedMembers.length - visibleMembers.length

  return (
    <VStack
      // {...debugBorder()}
      style={{
        backgroundColor: theme.colors.background.surface,
        paddingVertical: theme.spacing.xs,
      }}
    >
      {/* Members Header */}
      <HStack
        // {...debugBorder()}
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text>Members</Text>
        <IconButton
          hitSlop={theme.spacing.sm}
          iconWeight="medium"
          iconName="plus"
          variant="ghost"
          size="md"
          onPress={handleAddMembersPress}
        />
      </HStack>

      {/* Members Grid */}
      <VStack>
        {visibleMembers.map((member, index) => {
          const isAdmin = getAccountIsAdmin(members, member.inboxId)
          const isSuperAdmin = index === 0

          return (
            <MemberListItem
              key={member.inboxId}
              memberInboxId={member.inboxId}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
            />
          )
        })}

        {hasMoreMembers && (
          <Pressable onPress={handleSeeAllPress} hitSlop={theme.spacing.sm}>
            <GroupDetailsListItem
              title={`See all ${remainingMembersCount}`}
              end={<Icon size={theme.iconSize.sm} icon="chevron.right" />}
            />
          </Pressable>
        )}
      </VStack>
    </VStack>
  )
})
