import { translate } from "@i18n"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import React, { memo, useCallback } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { Text } from "@/design-system/Text"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { ConversationHeaderTitle } from "@/features/conversation/conversation-chat/conversation-chat-screen-header/conversation-screen-header-title"
import { useGroupName } from "@/hooks/use-group-name"
import { useRouter } from "@/navigation/use-navigation"
// import { useGroupPendingRequests } from "@/hooks/useGroupPendingRequests";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery"

type GroupConversationTitleProps = {
  conversationTopic: ConversationTopic
}

export const GroupConversationTitle = memo(({ conversationTopic }: GroupConversationTitleProps) => {
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
