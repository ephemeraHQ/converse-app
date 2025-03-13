import type { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/useGroupQuery"
import { updateXmtpGroupName } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { captureError } from "@/utils/capture-error"
import type { IConversationTopic } from "../conversation/conversation.types"
import { IGroup } from "./group.types"

type IArgs = {
  topic: IConversationTopic
  clientInboxId: IXmtpInboxId
}

export function useGroupNameMutation(args: {
  topic: IConversationTopic
  clientInboxId: IXmtpInboxId
}) {
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
      const updates: Partial<IGroup> = { groupName: name }

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

      const updates: Partial<IGroup> = { groupName: previousGroup?.name ?? "" }

      updateGroupQueryData({ inboxId: clientInboxId, topic, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        inboxId: clientInboxId,
        topic,
        conversationUpdate: updates,
      })
    },
  })
}
