import { useMutation } from "@tanstack/react-query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/group.query"
import { updateXmtpGroupImage } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { IConversationTopic } from "../conversation/conversation.types"

type IArgs = {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}

export function useGroupPhotoMutation(args: IArgs) {
  const { clientInboxId, topic } = args
  const { data: group } = useGroupQuery({ inboxId: clientInboxId, topic })

  return useMutation({
    mutationFn: async (groupImageUrl: string) => {
      if (!group || !clientInboxId || !topic) {
        throw new Error("Missing required data in useGroupPhotoMutation")
      }

      await updateXmtpGroupImage({
        clientInboxId: clientInboxId,
        groupId: topic as unknown as IXmtpConversationId,
        imageUrl: groupImageUrl,
      })
      return groupImageUrl
    },
    onMutate: async (groupImageUrl: string) => {
      const previousGroup = getGroupQueryData({ inboxId: clientInboxId, topic })
      const updates = { imageUrl: groupImageUrl }

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

      const updates = { imageUrl: previousGroup?.imageUrl ?? "" }
      updateGroupQueryData({ inboxId: clientInboxId, topic, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        inboxId: clientInboxId,
        topic,
        conversationUpdate: updates,
      })
    },
  })
}
