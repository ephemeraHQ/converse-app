import { translate } from "@i18n"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import React, { memo, useCallback } from "react"
// import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";
import { Avatar } from "@/components/avatar"
import { GroupAvatar } from "@/components/group-avatar"
import { HStack } from "@/design-system/HStack"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { useDmPeerInboxIdQuery } from "@/features/dm/use-dm-peer-inbox-id-query"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { useGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { copyToClipboard } from "@/utils/clipboard"

export function useConversationScreenHeader() {
  const navigation = useRouter()
  const conversationStore = useConversationStore()
  const isCreatingNewConversation = conversationStore.getState().isCreatingNewConversation
  const currentAccount = useCurrentSenderEthAddress()!
  const conversation = getConversationQueryData({
    account: currentAccount,
    topic: conversationStore.getState().topic!,
  })

  useHeader(
    {
      onBack: () => navigation.goBack(),
      safeAreaEdges: ["top"],
      // DM params
      ...(!isCreatingNewConversation &&
        conversation &&
        isConversationDm(conversation) && {
          titleComponent: <DmConversationTitle topic={conversation.topic} />,
        }),
      // Group params
      ...(!isCreatingNewConversation &&
        conversation &&
        isConversationGroup(conversation) && {
          titleComponent: <GroupConversationTitle conversationTopic={conversation.topic} />,
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
  conversationTopic: ConversationTopic
}

const GroupConversationTitle = memo(({ conversationTopic }: GroupConversationTitleProps) => {
  const currentAccount = useCurrentSenderEthAddress()!
  const router = useRouter()

  const { data: members } = useGroupMembersQuery({
    caller: "GroupConversationTitle",
    account: currentAccount,
    topic: conversationTopic,
  })

  const { groupName, isLoading: groupNameLoading } = useGroupName({
    conversationTopic,
  })

  const onPress = useCallback(() => {
    router.navigate("GroupDetails", { groupTopic: conversationTopic })
  }, [router, conversationTopic])

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
      avatarComponent={<GroupAvatar groupTopic={conversationTopic} size="md" />}
    />
  )
})

type DmConversationTitleProps = {
  topic: ConversationTopic
}

const DmConversationTitle = ({ topic }: DmConversationTitleProps) => {
  const account = useCurrentSenderEthAddress()!
  const navigation = useRouter()
  const { theme } = useAppTheme()

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account,
    topic,
    caller: "DmConversationTitle",
  })

  const { displayName, avatarUrl, isLoading } = usePreferredDisplayInfo({
    inboxId: peerInboxId!,
  })

  const onPress = useCallback(() => {
    if (peerInboxId) {
      navigation.push("Profile", { inboxId: peerInboxId })
    }
  }, [navigation, peerInboxId])

  const onLongPress = useCallback(() => {
    copyToClipboard(JSON.stringify(topic))
  }, [topic])

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
