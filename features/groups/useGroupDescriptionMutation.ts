import { useMutation } from "@tanstack/react-query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/useGroupQuery"
import { updateXmtpGroupDescription } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { IConversationTopic } from "../conversation/conversation.types"
import { IGroup } from "./group.types"

type IArgs = {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
}

export function useGroupDescriptionMutation(args: IArgs) {
  const { inboxId, topic } = args
  const { data: group } = useGroupQuery({ inboxId, topic })

  return useMutation({
    mutationFn: async (description: string) => {
      if (!group || !inboxId || !topic) {
        throw new Error("Missing required data in useGroupDescriptionMutation")
      }

      await updateXmtpGroupDescription({ group, description })
      return description
    },
    onMutate: async (description: string) => {
      const previousGroup = getGroupQueryData({ inboxId, topic })
      const updates: Partial<IGroup> = { groupDescription: description }

      if (previousGroup) {
        updateGroupQueryData({ inboxId, topic, updates })
      }

      updateConversationInAllowedConsentConversationsQueryData({
        inboxId,
        topic,
        conversationUpdate: updates,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      captureError(error)

      const { previousGroup } = context || {}

      const updates: Partial<IGroup> = {
        groupDescription: previousGroup?.groupDescription ?? "",
      }

      updateGroupQueryData({ inboxId, topic, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        inboxId,
        topic,
        conversationUpdate: updates,
      })
    },
  })
}
