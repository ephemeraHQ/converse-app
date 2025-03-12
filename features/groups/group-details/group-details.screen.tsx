import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { Screen } from "@/components/screen/screen"
import { ListItem, ListItemTitle } from "@/design-system/list-item"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { GroupDetailsMembersList } from "@/features/groups/group-details/components/group-details-members-list"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { useGroupQuery } from "@/features/groups/useGroupQuery"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useAppTheme } from "@/theme/use-app-theme"
import { useGroupDetailsScreenHeader } from "./group-details.screen-header"

export const GroupDetailsScreen = memo(function GroupDetailsScreen(
  props: NativeStackScreenProps<NavigationParamList, "GroupDetails">,
) {
  const { groupTopic: conversationTopic } = props.route.params

  const { theme } = useAppTheme()

  const currentSender = useSafeCurrentSender()

  const { groupName } = useGroupName({
    conversationTopic,
  })

  const { data: group } = useGroupQuery({
    inboxId: currentSender.ethereumAddress,
    topic: conversationTopic,
  })

  useGroupDetailsScreenHeader()

  if (!group) {
    return null
  }

  return (
    <Screen preset="scroll">
      {/* Header Section with Avatar and Group Info */}
      <VStack
        style={{
          paddingBottom: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.background.surface,
          alignItems: "center",
          justifyContent: "center",
          rowGap: theme.spacing.sm,
        }}
      >
        <GroupAvatar groupTopic={conversationTopic} size="xxl" />

        <VStack style={{ alignItems: "center", rowGap: theme.spacing.xxs }}>
          <Text preset="bigBold" style={{ textAlign: "center" }}>
            {groupName}
          </Text>
          {group?.groupDescription && (
            <Text style={{ textAlign: "center" }}>{group?.groupDescription}</Text>
          )}
          {/* <Text color="secondary" style={{ textAlign: "center" }}>
            convos.com/convos-crew
          </Text> */}
        </VStack>
      </VStack>

      <Separator />

      {/* Members Section */}
      <GroupDetailsMembersList topic={conversationTopic} />

      <Separator />

      {/* Exit Button */}
      <Pressable
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.background.surface,
        }}
        onPress={() => alert("Exit pressed")}
      >
        <ListItem title={<ListItemTitle color="caution">Exit</ListItemTitle>} />
      </Pressable>

      <Separator />
    </Screen>
  )
})

const Separator = memo(function Separator() {
  const { theme } = useAppTheme()

  return (
    <VStack
      style={{
        backgroundColor: theme.colors.background.sunken,
        height: theme.spacing.xxs,
      }}
    />
  )
})
