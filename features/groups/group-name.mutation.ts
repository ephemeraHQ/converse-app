import type { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/group.query"
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

  const { data: group } = useGroupQuery({ clientInboxId: clientInboxId, topic })

  return useMutation({
    mutationFn: async (name: string) => {
      if (!group || !topic) {
        throw new Error("Missing required data in useGroupNameMutation")
      }

      await updateXmtpGroupName({
        clientInboxId,
        groupId: group.id as unknown as IXmtpConversationId,
        name,
      })

      return name
    },
    onMutate: async (name: string) => {
      const previousGroup = getGroupQueryData({ clientInboxId: clientInboxId, topic })
      const updates: Partial<IGroup> = { name }

      if (previousGroup) {
        updateGroupQueryData({ clientInboxId: clientInboxId, topic, updates })
      }

      updateConversationInAllowedConsentConversationsQueryData({
        clientInboxId,
        topic,
        conversationUpdate: updates,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      captureError(error)

      const { previousGroup } = context || {}

      const updates: Partial<IGroup> = { name: previousGroup?.name ?? "" }

      updateGroupQueryData({ clientInboxId: clientInboxId, topic, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        clientInboxId,
        topic,
        conversationUpdate: updates,
      })
    },
  })
}
