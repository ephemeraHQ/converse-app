import { useMutation } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/useGroupQuery"
import { captureError } from "@/utils/capture-error"

type IArgs = {
  account: string
  topic: ConversationTopic
}

export function useGroupPhotoMutation(args: IArgs) {
  const { account, topic } = args
  const { data: group } = useGroupQuery({ inboxId: account, topic })

  return useMutation({
    mutationFn: async (groupImageUrl: string) => {
      if (!group || !account || !topic) {
        throw new Error("Missing required data in useGroupPhotoMutation")
      }

      await group.updateImageUrl(groupImageUrl)
      return groupImageUrl
    },
    onMutate: async (groupImageUrl: string) => {
      const previousGroup = getGroupQueryData({ inboxId: account, topic })
      const updates = { groupImageUrl }

      if (previousGroup) {
        updateGroupQueryData({ inboxId: account, topic, updates })
      }

      updateConversationInAllowedConsentConversationsQueryData({
        inboxId: account,
        topic,
        conversationUpdate: updates,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      captureError(error)

      const { previousGroup } = context || {}

      const updates = { groupImageUrl: previousGroup?.groupImageUrl ?? "" }
      updateGroupQueryData({ inboxId: account, topic, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        inboxId: account,
        topic,
        conversationUpdate: updates,
      })
    },
  })
}
