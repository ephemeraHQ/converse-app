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
  const { data: group } = useGroupQuery({ account, topic })

  return useMutation({
    mutationFn: async (imageUrlSquare: string) => {
      if (!group || !account || !topic) {
        throw new Error("Missing required data in useGroupPhotoMutation")
      }

      await group.updateGroupImageUrlSquare(imageUrlSquare)
      return imageUrlSquare
    },
    onMutate: async (imageUrlSquare: string) => {
      const previousGroup = getGroupQueryData({ account, topic })
      const updates = { imageUrlSquare }

      if (previousGroup) {
        updateGroupQueryData({ account, topic, updates })
      }

      updateConversationInAllowedConsentConversationsQueryData({
        account,
        topic,
        conversationUpdate: updates,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      captureError(error)

      const { previousGroup } = context || {}

      const updates = { imageUrlSquare: previousGroup?.imageUrlSquare ?? "" }
      updateGroupQueryData({ account, topic, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        account,
        topic,
        conversationUpdate: updates,
      })
    },
  })
}
