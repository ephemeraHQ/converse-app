import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { ListItem, ListItemTitle } from "@/components/list-item"
import { Screen } from "@/components/screen/screen"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupName } from "@/hooks/useGroupName"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useGroupQuery } from "@/queries/useGroupQuery"
import { useAppTheme } from "@/theme/use-app-theme"
import { MembersList } from "../components/group-details-members-list"
import { useGroupDetailsScreenHeader } from "./group-details.screen-header"

export const GroupDetailsScreen = memo(function GroupDetailsScreen(
  props: NativeStackScreenProps<NavigationParamList, "GroupDetails">,
) {
  const { conversationTopic } = props.route.params

  const { theme } = useAppTheme()

  const currentSender = useSafeCurrentSender()

  const { groupName } = useGroupName({
    conversationTopic,
  })

  const { data: group } = useGroupQuery({
    account: currentSender.ethereumAddress,
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
          {group?.description && <Text style={{ textAlign: "center" }}>{group?.description}</Text>}
          {/* <Text color="secondary" style={{ textAlign: "center" }}>
            convos.com/convos-crew
          </Text> */}
        </VStack>
      </VStack>

      <Separator />

      {/* Members Section */}
      <MembersList topic={conversationTopic} />

      <Separator />

      {/* Exit Button */}
      <Pressable
        style={{
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.xs,
        }}
        onPress={() => console.log("Exit pressed")}
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
