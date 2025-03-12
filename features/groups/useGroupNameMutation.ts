import { useMutation } from "@tanstack/react-query"
import type { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/useGroupQuery"
import { updateXmtpGroupName } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"

type IArgs = {
  topic: ConversationTopic
  clientInboxId: InboxId
}

export function useGroupNameMutation(args: { topic: ConversationTopic; clientInboxId: InboxId }) {
  const { topic, clientInboxId } = args

  const { data: group } = useGroupQuery({ inboxId: clientInboxId, topic })

  return useMutation({
    mutationFn: async (name: string) => {
      if (!group || !topic) {
        throw new Error("Missing required data in useGroupNameMutation")
      }

      await updateXmtpGroupName({ group, name })

      return name
    },
    onMutate: async (name: string) => {
      const previousGroup = getGroupQueryData({ inboxId: clientInboxId, topic })
      const updates: Partial<IXmtpGroupWithCodecs> = { groupName: name }

      if (previousGroup) {
        updateGroupQueryData({ inboxId: clientInboxId, topic, updates })
      }

      updateConversationInAllowedConsentConversationsQueryData({
        inboxId: clientInboxId,
        topic,
        conversationUpdate: updates,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      captureError(error)

      const { previousGroup } = context || {}

      const updates: Partial<IXmtpGroupWithCodecs> = { groupName: previousGroup?.groupName ?? "" }

      updateGroupQueryData({ inboxId: clientInboxId, topic, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        inboxId: clientInboxId,
        topic,
        conversationUpdate: updates,
      })
    },
  })
}
