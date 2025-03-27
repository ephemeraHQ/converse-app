import { translate } from "@i18n"
import React, { memo, useCallback } from "react"
// import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";
import { Avatar } from "@/components/avatar"
import { GroupAvatar } from "@/components/group-avatar"
import { HStack } from "@/design-system/HStack"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useConversationQuery } from "@/features/conversation/queries/conversation.query"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { useDmQuery } from "@/features/dm/dm.query"
import { useGroupMembers } from "@/features/groups/hooks/use-group-members"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { copyToClipboard } from "@/utils/clipboard"

export function useConversationScreenHeader() {
  const navigation = useRouter()
  const conversationStore = useConversationStore()
  const isCreatingNewConversation = conversationStore.getState().isCreatingNewConversation
  const currentSender = useSafeCurrentSender()
  const { data: conversation } = useConversationQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId: conversationStore.getState().xmtpConversationId!,
    caller: "useConversationScreenHeader",
  })

  useHeader(
    {
      onBack: () => navigation.goBack(),
      safeAreaEdges: ["top"],
      // DM params
      ...(!isCreatingNewConversation &&
        conversation &&
        isConversationDm(conversation) && {
          titleComponent: <DmConversationTitle xmtpConversationId={conversation.xmtpId} />,
        }),
      // Group params
      ...(!isCreatingNewConversation &&
        conversation &&
        isConversationGroup(conversation) && {
          titleComponent: <GroupConversationTitle xmtpConversationId={conversation.xmtpId} />,
        }),
      // New conversation params
      ...(isCreatingNewConversation && {
        title: "New chat",
        withBottomBorder: true,
      }),
    },
    [conversation, isCreatingNewConversation],
  )
}

type ConversationTitleDumbProps = {
  title?: string
  subtitle?: React.ReactNode
  avatarComponent?: React.ReactNode
  onLongPress?: () => void
  onPress?: () => void
}

function ConversationHeaderTitle({
  avatarComponent,
  title,
  subtitle,
  onLongPress,
  onPress,
}: ConversationTitleDumbProps) {
  const { theme } = useAppTheme()

  return (
    <HStack
      style={{
        flex: 1,
      }}
    >
      <Pressable
        onLongPress={onLongPress}
        onPress={onPress}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <HStack
          style={{
            paddingRight: theme.spacing.xxs,
          }}
        >
          {avatarComponent}
        </HStack>
        <VStack
          style={{
            flex: 1,
          }}
        >
          <Text numberOfLines={1} allowFontScaling={false}>
            {title}
          </Text>
          {subtitle}
        </VStack>
      </Pressable>
    </HStack>
  )
}

type GroupConversationTitleProps = {
  xmtpConversationId: IXmtpConversationId
}

const GroupConversationTitle = memo(({ xmtpConversationId }: GroupConversationTitleProps) => {
  const currentSender = useSafeCurrentSender()
  const router = useRouter()

  const { members } = useGroupMembers({
    caller: "GroupConversationTitle",
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { groupName, isLoading: groupNameLoading } = useGroupName({
    xmtpConversationId,
  })

  const onPress = useCallback(() => {
    router.navigate("GroupDetails", { xmtpConversationId })
  }, [router, xmtpConversationId])

  const requestsCount = 0 // TODO useGroupPendingRequests(conversationTopic).length;

  if (groupNameLoading) {
    return null
  }

  const memberText =
    members?.ids.length === 1
      ? translate("member_count", { count: members?.ids.length })
      : translate("members_count", { count: members?.ids.length })
  const displayMemberText = members?.ids.length

  return (
    <ConversationHeaderTitle
      title={groupName ?? undefined}
      onPress={onPress}
      subtitle={
        displayMemberText ? (
          <Text preset="formLabel">
            {memberText}
            {requestsCount > 0 && (
              <>
                {" • "}
                <Text preset="formLabel" color="action">
                  {translate("pending_count", { count: requestsCount })}
                </Text>
              </>
            )}
          </Text>
        ) : null
      }
      avatarComponent={<GroupAvatar xmtpConversationId={xmtpConversationId} size="md" />}
    />
  )
})

type DmConversationTitleProps = {
  xmtpConversationId: IXmtpConversationId
}

const DmConversationTitle = ({ xmtpConversationId }: DmConversationTitleProps) => {
  const currentSender = useSafeCurrentSender()
  const navigation = useRouter()
  const { theme } = useAppTheme()

  const { data: dm } = useDmQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { displayName, avatarUrl, isLoading } = usePreferredDisplayInfo({
    inboxId: dm?.peerInboxId,
  })

  const onPress = useCallback(() => {
    if (dm?.peerInboxId) {
      navigation.push("Profile", { inboxId: dm.peerInboxId })
    }
  }, [dm?.peerInboxId, navigation])

  const onLongPress = useCallback(() => {
    copyToClipboard(JSON.stringify(xmtpConversationId))
  }, [xmtpConversationId])

  if (isLoading) {
    return null
  }

  return (
    <ConversationHeaderTitle
      title={displayName}
      onLongPress={onLongPress}
      onPress={onPress}
      avatarComponent={
        <Avatar uri={avatarUrl} sizeNumber={theme.avatarSize.md} name={displayName} />
      }
    />
  )
}
