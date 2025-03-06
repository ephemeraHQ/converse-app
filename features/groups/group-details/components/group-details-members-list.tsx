import { ConversationTopic } from "@xmtp/react-native-sdk"
import { memo, useCallback, useMemo } from "react"
import { HStack } from "@/design-system/HStack"
import { IconButton } from "@/design-system/IconButton/IconButton"
import { ListItemEndRightChevron } from "@/design-system/list-item"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { MemberDetailsBottomSheet } from "@/features/groups/group-details/components/group-details-member-details.bottom-sheet"
import { GroupDetailsListItem } from "@/features/groups/group-details/components/group-details.ui"
import { getGroupMemberIsAdmin } from "@/features/groups/utils/group-admin.utils"
import { useRouter } from "@/navigation/use-navigation"
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery"
import { useAppTheme } from "@/theme/use-app-theme"
import { MemberListItem } from "./group-details-members-list-item"

export const GroupDetailsMembersList = memo(function GroupDetailsMembersList(props: {
  topic: ConversationTopic
}) {
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
    return Object.values(members?.byId || {})
    // return sortGroupMembersByAdminStatus(, currentSenderEthAddress)
  }, [members])

  const handleAddMembersPress = useCallback(() => {
    router.push("AddGroupMembers", { groupTopic: topic })
  }, [topic, router])

  const handleSeeAllPress = useCallback(() => {
    router.push("GroupMembersList", { groupTopic: topic })
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
        {visibleMembers.map((member) => {
          return <MemberListItem key={member.inboxId} memberInboxId={member.inboxId} />
        })}

        {hasMoreMembers && (
          <Pressable onPress={handleSeeAllPress} hitSlop={theme.spacing.sm}>
            <GroupDetailsListItem
              title={`See all ${remainingMembersCount}`}
              end={<ListItemEndRightChevron />}
            />
          </Pressable>
        )}
      </VStack>

      <MemberDetailsBottomSheet />
    </VStack>
  )
})
