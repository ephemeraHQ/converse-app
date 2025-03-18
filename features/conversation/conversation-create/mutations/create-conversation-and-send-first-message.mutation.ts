import { IXmtpConversationId, IXmtpInboxId, IXmtpMessageId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getMessageWithType } from "@/features/conversation/conversation-chat/conversation-message/utils/get-message-with-type"
import {
  addMessageToConversationMessagesQueryData,
  setConversationMessagesQueryData,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import {
  addConversationToAllowedConsentConversationsQuery,
  invalidateAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { IConversation, IConversationTopic } from "@/features/conversation/conversation.types"
import { setConversationQueryData } from "@/features/conversation/queries/conversation.query"
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

export function useCreateConversationAndSendFirstMessageMutation() {
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
      const result = await sendMessage({
        xmtpConversationId: conversation.xmtpId,
        contents,
      })

      return { conversation, sentMessage: result.message, sentMessageId: result.xmtpMessageId }
    },
    onMutate: ({ inboxIds, contents }) => {
      const currentSender = getSafeCurrentSender()

      const isGroup = inboxIds.length > 1
      const tmpXmtpConversationId =
        `${TEMP_CONVERSATION_PREFIX}${getRandomId()}` as IXmtpConversationId
      const tmpXmtpConversationTopic =
        `${TEMP_CONVERSATION_PREFIX}${getRandomId()}` as IConversationTopic
      const tmpXmtpMessageId = getRandomId() as IXmtpMessageId

      const optimisticMessage = getMessageWithType({
        baseMessage: {
          xmtpTopic: tmpXmtpConversationTopic,
          xmtpConversationId: tmpXmtpConversationId,
          xmtpId: tmpXmtpMessageId,
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

      // Add to your conversations main list
      addConversationToAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
        conversationId: tempConversation.xmtpId,
      })

      addMessageToConversationMessagesQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: tmpXmtpConversationId,
        message: optimisticMessage,
      })

      // Not sure of doing this here but didn't work in the parent because even if we use .mutate we con't have access to the context...
      conversationStore.setState({
        xmtpConversationId: tmpXmtpConversationId,
        isCreatingNewConversation: false,
      })

      return {
        tmpXmtpConversationId,
      }
    },
    onSuccess: (result, variables, context) => {
      const currentSender = getSafeCurrentSender()

      // Add the message to the real conversation messages query
      // Set first because we want to already have the message in the query
      setConversationMessagesQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: result.conversation.xmtpId,
        data: {
          ids: [result.sentMessageId],
          byId: {
            [result.sentMessageId]: result.sentMessage,
          },
          reactions: {},
        },
      })

      // Set the real conversation query data
      setConversationQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: result.conversation.xmtpId,
        conversation: {
          ...result.conversation,
          lastMessage: result.sentMessage,
        },
      })

      // Add the conversation in the allowed consent conversations query
      addConversationToAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
        conversationId: result.conversation.xmtpId,
      })

      // Remove the temp conversation from the allowed consent conversations query
      removeConversationFromAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
        conversationId: context.tmpXmtpConversationId,
      })
    },
    onError: (error, variables, context) => {
      if (!context) {
        return
      }

      const currentSender = getSafeCurrentSender()

      invalidateAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
      }).catch(captureError)
    },
  })
}

// function replaceOptimisticConversationWithReal(args: {
//   tmpXmtpConversationId: IXmtpConversationId
//   clientInboxId: IXmtpInboxId
//   realConversation: IConversation
// }) {
//   const { tmpXmtpConversationId, clientInboxId, realConversation } = args

//   // Update conversation query data
//   setConversationQueryData({
//     clientInboxId,
//     xmtpConversationId: realConversation.xmtpId,
//     conversation: realConversation,
//   })

//   // Remove temp conversation
//   // setConversationQueryData({
//   //   clientInboxId,
//   //   xmtpConversationId: tmpXmtpConversationId,
//   //   conversation: null,
//   // })

//   // // Update allowed conversations list
//   // const existingConversations = reactQueryClient.getQueryData(
//   //   getAllowedConsentConversationsQueryOptions({
//   //     clientInboxId,
//   //   }).queryKey,
//   // )

//   // if (!existingConversations) {
//   //   return
//   // }

//   // // Find index of temp conversation
//   // const tempConversationIndex = existingConversations.ids.indexOf(tmpXmtpConversationId)

//   // if (tempConversationIndex === -1) {
//   //   captureError(new Error("[replaceOptimisticConversationWithReal] Temp conversation not found"))
//   //   return
//   // }

//   // // Replace temp with real conversation
//   // const newIds = [...existingConversations.ids]
//   // newIds[tempConversationIndex] = realConversation.xmtpId

//   // const newById = {
//   //   [realConversation.xmtpId]: realConversation,
//   //   ...existingConversations.byId,
//   // }
//   // delete newById[tmpXmtpConversationId]

//   // const updatedState = {
//   //   ...existingConversations,
//   //   ids: newIds,
//   //   byId: newById,
//   // }

//   // return reactQueryClient.setQueryData(
//   //   getAllowedConsentConversationsQueryOptions({ clientInboxId }).queryKey,
//   //   updatedState,
//   // )
// }
