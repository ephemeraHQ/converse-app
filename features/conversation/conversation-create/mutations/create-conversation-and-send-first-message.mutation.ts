import { IXmtpConversationId, IXmtpInboxId, IXmtpMessageId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getMessageWithType } from "@/features/conversation/conversation-chat/conversation-message/utils/get-message-with-type"
import {
  addMessageToConversationMessagesQuery,
  invalidateConversationMessagesQuery,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import {
  addConversationToAllowedConsentConversationsQuery,
  invalidateAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { IConversation, IConversationTopic } from "@/features/conversation/conversation.types"
import {
  invalidateConversationQuery,
  setConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { TEMP_CONVERSATION_PREFIX } from "@/features/conversation/utils/is-temp-conversation"
import { setDmQueryData } from "@/features/dm/dm.query"
import { IDm } from "@/features/dm/dm.types"
import { setGroupQueryData } from "@/features/groups/group.query"
import { IGroup } from "@/features/groups/group.types"
import { getGroupNameForGroupMembers } from "@/features/groups/hooks/use-group-name"
import { createXmtpDm } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-dm"
import { createXmtpGroup } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { captureError } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { entify } from "@/utils/entify"
import { getRandomId } from "@/utils/general"
import { ISendMessageParams, sendMessage } from "../../hooks/use-send-message"

export function useCreateConversationAndSendFirstMessage() {
  const conversationStore = useConversationStore()

  return useMutation({
    mutationFn: async (args: {
      inboxIds: IXmtpInboxId[]
      contents: ISendMessageParams["contents"]
    }) => {
      const { inboxIds, contents } = args

      if (!inboxIds.length) {
        throw new Error("No inboxIds provided")
      }

      if (!contents.length) {
        throw new Error(`No content provided`)
      }

      const currentSender = getSafeCurrentSender()

      // Create conversation
      const conversation =
        inboxIds.length > 1
          ? await convertXmtpConversationToConvosConversation(
              await createXmtpGroup({
                clientInboxId: currentSender.inboxId,
                inboxIds,
              }),
            )
          : await convertXmtpConversationToConvosConversation(
              await createXmtpDm({
                senderClientInboxId: currentSender.inboxId,
                peerInboxId: inboxIds[0],
              }),
            )

      // Send message
      const messageId = await sendMessage({
        xmtpConversationId: conversation.xmtpId,
        contents,
      })

      return { conversation, messageId }
    },
    onMutate: async ({ inboxIds, contents }) => {
      const currentSender = getSafeCurrentSender()

      const isGroup = inboxIds.length > 1
      const tmpXmtpConversationId =
        `${TEMP_CONVERSATION_PREFIX}-${getRandomId()}` as IXmtpConversationId
      const tmpXmtpConversationTopic =
        `${TEMP_CONVERSATION_PREFIX}-${getRandomId()}` as IConversationTopic

      const optimisticMessage = getMessageWithType({
        baseMessage: {
          xmtpTopic: tmpXmtpConversationTopic,
          xmtpConversationId: tmpXmtpConversationId,
          xmtpId: "" as IXmtpMessageId,
          senderInboxId: currentSender.inboxId,
          sentNs: getTodayNs(),
          status: "sending",
        },
        // TODO: Add support for multiple contents
        content: contents[0],
      })

      // Create optimistic conversation
      let tempConversation: IConversation

      if (isGroup) {
        tempConversation = {
          type: "group",
          createdAt: new Date().getTime(),
          xmtpId: tmpXmtpConversationId,
          name: getGroupNameForGroupMembers({ memberInboxIds: inboxIds }),
          creatorInboxId: currentSender.inboxId,
          description: "",
          addedByInboxId: currentSender.inboxId,
          consentState: "allowed",
          members: entify(
            inboxIds.map((inboxId) => ({
              consentState: currentSender.inboxId === inboxId ? "allowed" : "unknown",
              permission: currentSender.inboxId === inboxId ? "super_admin" : "member",
              inboxId,
            })),
            (member) => member.inboxId,
          ),
          lastMessage: optimisticMessage,
          xmtpTopic: tmpXmtpConversationTopic,
        } satisfies IGroup

        setGroupQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: tmpXmtpConversationId,
          group: tempConversation,
        })
      }
      // DM
      else {
        tempConversation = {
          type: "dm",
          createdAt: new Date().getTime(),
          xmtpId: tmpXmtpConversationId,
          peerInboxId: inboxIds[0],
          consentState: "allowed",
          lastMessage: optimisticMessage,
          xmtpTopic: tmpXmtpConversationTopic,
        } satisfies IDm

        setDmQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: tmpXmtpConversationId,
          dm: tempConversation,
        })
      }

      // The conversation is in the query data so let's show it!
      conversationStore.setState({
        xmtpConversationId: tmpXmtpConversationId,
      })

      // Add to your conversations main list
      addConversationToAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
        conversation: tempConversation,
      })

      addMessageToConversationMessagesQuery({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: tmpXmtpConversationId,
        message: optimisticMessage,
      })

      return {
        tempXmtpConversationId: tmpXmtpConversationId,
      }
    },
    onSuccess: (result, variables, context) => {
      const currentSender = getSafeCurrentSender()

      invalidateConversationQuery({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: result.conversation.xmtpId,
      }).catch(captureError)

      invalidateAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
      }).catch(captureError)

      invalidateConversationMessagesQuery({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: result.conversation.xmtpId,
      }).catch(captureError)

      // Replace with the real conversation
      conversationStore.setState({
        xmtpConversationId: result.conversation.xmtpId,
      })

      // maybeReplaceOptimisticConversationWithReal
    },
    onError: (error, variables, context) => {
      if (!context) {
        return
      }

      const currentSender = getSafeCurrentSender()

      // Remove created Conversation
      removeConversationFromAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: context.tempXmtpConversationId,
      })

      setConversationQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: context.tempXmtpConversationId,
        conversation: null,
      })
    },
  })
}
