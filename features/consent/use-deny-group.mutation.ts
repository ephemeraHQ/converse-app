import { useMutation } from "@tanstack/react-query"
import { logger } from "@utils/logger"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { updateConsentForGroupsForAccount } from "@/features/consent/update-consent-for-groups-for-account"
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQueryData,
} from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getConversationIdFromTopic } from "@/features/conversation/utils/get-conversation-id-from-topic"
import { getGroupQueryData, setGroupQueryData } from "@/features/groups/useGroupQuery"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"

export const useDenyGroupMutation = (account: string, topic: ConversationTopic) => {
  return useMutation({
    mutationFn: async () => {
      if (!topic || !account) {
        return
      }
      await updateConsentForGroupsForAccount({
        account,
        groupIds: [getConversationIdFromTopic(topic)],
        consent: "deny",
      })
      return "denied"
    },
    onMutate: async () => {
      const previousGroup = getGroupQueryData({ account, topic })

      if (!previousGroup) {
        throw new Error("Previous group not found")
      }

      const updatedGroup = updateObjectAndMethods(previousGroup!, {
        state: "denied",
      })

      setGroupQueryData({ account, topic, group: updatedGroup })

      // Remove from main conversations list
      removeConversationFromAllowedConsentConversationsQuery({
        account,
        topic: topic!,
      })

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQueryData({
        account,
        topic,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      if (!context) {
        return
      }

      setGroupQueryData({ account, topic, group: context.previousGroup })

      // Add back to main conversations list
      addConversationToAllowedConsentConversationsQuery({
        account,
        conversation: context.previousGroup,
      })

      // Add back to requests
      addConversationToUnknownConsentConversationsQuery({
        account,
        conversation: context.previousGroup,
      })
    },
    onSuccess: () => {
      logger.debug("onSuccess useBlockGroupMutation")
    },
  })
}
