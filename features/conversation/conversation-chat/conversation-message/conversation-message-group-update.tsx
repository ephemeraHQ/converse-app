import { HStack } from "@design-system/HStack"
import { Pressable } from "@design-system/Pressable"
import { ITextProps, Text } from "@design-system/Text"
import { translate, TxKeyPath } from "@i18n"
import { memo } from "react"
import { ViewStyle } from "react-native"
import { Avatar } from "@/components/avatar"
import { Center } from "@/design-system/Center"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { navigate } from "@/navigation/navigation.utils"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import {
  IConversationMessageGroupUpdated,
  IGroupUpdatedMetadataEntry,
} from "./conversation-message.types"

type IConversationMessageGroupUpdateProps = {
  message: IConversationMessageGroupUpdated
}

export function ConversationMessageGroupUpdate({ message }: IConversationMessageGroupUpdateProps) {
  const { theme } = useAppTheme()

  const content = message.content

  if (typeof content === "string") {
    // TODO
    return null
  }

  return (
    <Center
      // {...debugBorder()}
      style={{
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        flexWrap: "wrap",
        rowGap: theme.spacing.sm,
        width: "100%",
      }}
    >
      {/* Member additions */}
      {content.membersAdded.map((member) => (
        <ChatGroupMemberJoined
          key={`joined-${member.inboxId}`}
          inboxId={member.inboxId as IXmtpInboxId}
        />
      ))}

      {/* Member removals */}
      {content.membersRemoved.map((member) => (
        <ChatGroupMemberLeft
          key={`left-${member.inboxId}`}
          inboxId={member.inboxId as IXmtpInboxId}
        />
      ))}

      {/* Metadata changes */}
      {content.metadataFieldsChanged.map((entry, index) => (
        <ChatGroupMetadataUpdate
          key={`metadata-${index}`}
          metadataEntry={entry}
          initiatorInboxId={content.initiatedByInboxId as IXmtpInboxId}
        />
      ))}
    </Center>
  )
}

type IChatGroupMemberLeftProps = {
  inboxId: IXmtpInboxId
}

function ChatGroupMemberLeft({ inboxId }: IChatGroupMemberLeftProps) {
  const { themed, theme } = useAppTheme()
  const { displayName, avatarUrl } = usePreferredDisplayInfo({ inboxId })

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        style={themed($pressableContent)}
        onPress={() => {
          navigate("Profile", {
            inboxId,
          })
        }}
      >
        <Avatar sizeNumber={theme.avatarSize.xs} uri={avatarUrl} name={displayName ?? ""} />
        <ChatGroupUpdateText weight="bold">{displayName ?? ""}</ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>{translate("group_member_left")}</ChatGroupUpdateText>
    </HStack>
  )
}

type IChatGroupMemberJoinedProps = {
  inboxId: IXmtpInboxId
}

function ChatGroupMemberJoined({ inboxId }: IChatGroupMemberJoinedProps) {
  const { themed, theme } = useAppTheme()
  const { displayName, avatarUrl } = usePreferredDisplayInfo({ inboxId })

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            inboxId,
          })
        }}
        style={themed($pressableContent)}
      >
        <Avatar sizeNumber={theme.avatarSize.xs} uri={avatarUrl} name={displayName ?? ""} />
        <ChatGroupUpdateText weight="bold">{displayName ?? ""}</ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>{translate("group_member_joined")}</ChatGroupUpdateText>
    </HStack>
  )
}

type IChatGroupMetadataUpdateProps = {
  metadataEntry: IGroupUpdatedMetadataEntry
  initiatorInboxId: IXmtpInboxId
}

function ChatGroupMetadataUpdate({
  metadataEntry,
  initiatorInboxId,
}: IChatGroupMetadataUpdateProps) {
  const { themed, theme } = useAppTheme()
  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: initiatorInboxId,
  })

  let txKey: TxKeyPath
  let txParams: Record<string, string> = {}

  switch (metadataEntry.fieldName) {
    case "group_name":
      txKey = "group_name_changed_to"
      txParams = { newValue: metadataEntry.newValue }
      break
    case "group_image_url_square":
      txKey = "group_photo_changed"
      break
    case "description":
      txKey = "group_description_changed"
      txParams = { newValue: metadataEntry.newValue }
      break
    default:
      return null
  }

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            inboxId: initiatorInboxId,
          })
        }}
        style={themed($pressableContent)}
      >
        <Avatar sizeNumber={theme.avatarSize.xs} uri={avatarUrl} name={displayName ?? ""} />
        <ChatGroupUpdateText weight="bold">{displayName ?? ""}</ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>{translate(txKey, txParams)}</ChatGroupUpdateText>
    </HStack>
  )
}

const ChatGroupUpdateText = memo(function ChatGroupUpdateText(props: ITextProps) {
  const { style, ...rest } = props
  return (
    <Text
      style={[{ textAlign: "center", flexWrap: "wrap" }, style]}
      color="secondary"
      preset="smaller"
      {...rest}
    />
  )
})

const $memberContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center",
  columnGap: spacing.xxxs,
  width: "100%",
})

const $pressableContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  columnGap: spacing.xxxs,
  alignItems: "center",
  flexDirection: "row",
})
