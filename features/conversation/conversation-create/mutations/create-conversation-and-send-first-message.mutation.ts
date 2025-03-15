import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationMessageId } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
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
import {
  invalidateConversationQuery,
  setConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { setDmQueryData } from "@/features/dm/dm.query"
import { IDm } from "@/features/dm/dm.types"
import { setGroupQueryData } from "@/features/groups/group.query"
import { IGroup } from "@/features/groups/group.types"
import { getGroupNameForGroupMembers } from "@/features/groups/hooks/use-group-name"
import { createXmtpDm } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-dm"
import { createXmtpGroup } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { captureError } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"
import { IConversation, IConversationId, IConversationTopic } from "../../conversation.types"
import { ISendMessageParams, sendMessage } from "../../hooks/use-send-message"

// export async function sendMessage(
//   args: ISendMessageParams
// ): Promise<MessageId> {
//   const { referencedMessageId, content, topic } = args;
//   logger.info("[send-optimistic][sendMessage] Starting to send message", {
//     referencedMessageId,
//     content: JSON.stringify(content, null, 2),
//     topic,
//   });

//   const conversation = await getOrFetchConversation({
//     topic,
//     account: getCurrentAccount()!,
//     caller: "use-send-message#sendMessage",
//   });

//   if (!conversation) {
//     logger.error("[send-optimistic][sendMessage] Conversation not found");
//     throw new Error("Conversation not found when sending message");
//   }

//   logger.info("[send-optimistic][sendMessage] Found conversation", {
//     conversationTopic: conversation.topic,
//   });

//   logger.info("[send-optimistic][sendMessage] Sending new message");
//   const messageId = await conversation.send(
//     content.remoteAttachment
//       ? { remoteAttachment: content.remoteAttachment }
//       : { text: content.text! }
//   );

//   logger.info("[send-optimistic][sendMessage] Message sent successfully", {
//     messageId,
//   });
//   return messageId;
// }

export const TEMP_CONVERSATION_PREFIX = "tmp-"

function getConversationTempTopic(args: { inboxIds: IXmtpInboxId[] }) {
  const { inboxIds } = args
  return `${TEMP_CONVERSATION_PREFIX}${generateGroupHashFromMemberIds(
    inboxIds,
  )}` as IConversationTopic
}

// Maybe keep alive the temp topic conversation and just update it as new data comes from stream?
// And when we want to send a message we can use this map to get the real topic?
// Maybe too complex, just a thought.
// Let's try invalidating and causing a rerender first to see how the FE reacts
// const tempConversationTopicToRealMap = new Map<IConversationTopic, IConversationTopic>()

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
        topic: conversation.topic,
        contents,
      })

      return { conversation, messageId }
    },
    onMutate: ({ inboxIds, contents }) => {
      const currentSender = getSafeCurrentSender()

      const isGroup = inboxIds.length > 1
      const tempTopic = getConversationTempTopic({
        inboxIds: [currentSender.inboxId, ...inboxIds],
      })

      // Now create optimistic message
      const generatedMessageId = getRandomId() as IConversationMessageId

      const optimisticMessage = getMessageWithType({
        baseMessage: {
          id: generatedMessageId,
          topic: tempTopic,
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
          id: "" as IConversationId,
          type: "group",
          createdAt: new Date().getTime(),
          topic: tempTopic,
          name: getGroupNameForGroupMembers({ memberInboxIds: inboxIds }),
          creatorInboxId: currentSender.inboxId,
          description: "",
          addedByInboxId: currentSender.inboxId,
          consentState: "allowed",
          members: inboxIds.map((inboxId) => ({
            consentState: currentSender.inboxId === inboxId ? "allowed" : "unknown",
            permission: currentSender.inboxId === inboxId ? "super_admin" : "member",
            inboxId,
          })),
          lastMessage: optimisticMessage,
        } satisfies IGroup

        setGroupQueryData({
          clientInboxId: currentSender.inboxId,
          topic: tempTopic,
          group: tempConversation,
        })
      }
      // DM
      else {
        tempConversation = {
          id: "" as IConversationId,
          type: "dm",
          createdAt: new Date().getTime(),
          topic: tempTopic,
          peerInboxId: inboxIds[0],
          consentState: "allowed",
          lastMessage: optimisticMessage,
        } satisfies IDm

        setDmQueryData({
          clientInboxId: currentSender.inboxId,
          topic: tempTopic,
          dm: tempConversation,
        })
      }

      // The conversation is in the query data so let's show it!
      conversationStore.setState({
        topic: tempTopic,
      })

      // Add to your conversations main list
      addConversationToAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
        conversation: tempConversation,
      })

      addMessageToConversationMessagesQuery({
        clientInboxId: currentSender.inboxId,
        topic: tempTopic,
        message: optimisticMessage,
      })

      return { generatedMessageId, tempTopic }
    },
    onSuccess: (result, variables, context) => {
      const currentSender = getSafeCurrentSender()

      invalidateConversationQuery({
        clientInboxId: currentSender.inboxId,
        topic: result.conversation.topic,
      }).catch(captureError)

      invalidateAllowedConsentConversationsQuery({
        clientInboxId: currentSender.inboxId,
      }).catch(captureError)

      invalidateConversationMessagesQuery({
        clientInboxId: currentSender.inboxId,
        topic: context.tempTopic,
      }).catch(captureError)

      // Replace with the real conversation
      conversationStore.setState({
        topic: result.conversation.topic,
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
        topic: context.tempTopic,
      })

      setConversationQueryData({
        clientInboxId: currentSender.inboxId,
        topic: context.tempTopic,
        conversation: null,
      })
    },
  })
}

// export function maybeReplaceOptimisticConversationWithReal(args: {
//   clientInboxId: IXmtpInboxId
//   memberInboxIds: IXmtpInboxId[]
//   realTopic: IConversationTopic
// }) {
//   const { clientInboxId, memberInboxIds, realTopic } = args

//   const tempTopic = getConversationTempTopic({
//     inboxIds: memberInboxIds,
//   })

//   const realConversation = getConversationQueryData({
//     clientInboxId,
//     topic: realTopic,
//   })

//   if (!realConversation) {
//     throw new Error("Real conversation not found")
//   }

//   updateConversationQueryData({
//     clientInboxId,
//     topic: tempTopic,
//     conversationUpdate: realConversation,
//   })

//   // Now move the messages from the temp conversation to the real conversation
//   const messages = getConversationMessagesQueryData({
//     clientInboxId,
//     topic: tempTopic,
//   })

//   if (messages) {
//     setConversationMessagesQueryData({
//       clientInboxId,
//       topic: realTopic,
//       data: messages,
//     })
//   }

// Get messages for the temporary conversation
// const messages: IMessageAccumulator | undefined =
//   getConversationMessagesQueryData({
//     account,
//     topic: tempTopic,
//   });

// // If we found messages for the temp conversation, update them with the real topic
// if (messages?.ids?.length && messages.ids.length > 0) {
//   queryClient.setQueryData(
//     conversationMessagesQueryKey(account, realTopic),
//     messages.ids.map((messageId) => {
//       const message = messages.byId[messageId];
//       return {
//         ...message,
//         topic: realTopic,
//         // Preserve existing delivery status
//         deliveryStatus: message.deliveryStatus || "sent",
//       };
//     })
//   );
// }
// }

/**
 * Produce a 16-hex-digit hash (64-bit) from an array of member IDs,
 * regardless of how many members there are. The result is a stable,
 * constant-length string for a given input order-insensitively.
 *
 * Note: this algorithm is arbitrarily chosen to be stable and deterministic.
 * Any implementation that produces a stable, constant-length string for a
 * given input order-insensitively is acceptable.
 *
 * 1) We sort and lowercase the members to normalize.
 * 2) Convert them into a JSON string (so the order is stable).
 * 3) Perform two passes of a FNV-1a–style hashing:
 *    - Forward pass
 *    - Reverse pass
 * 4) Combine both 32-bit results into a single 64-bit hex string.
 *
 * WARNING: This is NOT cryptographically secure. Just a stable "fingerprint."
 *
 * @throws {Error} If members array is empty
 */
function generateGroupHashFromMemberIds(inboxIds: IXmtpInboxId[]) {
  if (!inboxIds.length) {
    return undefined
  }

  // 1) Sort members (case-insensitive) and deduplicate
  const sorted = [...new Set(inboxIds)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  )
  // 2) Lowercase them^
  const lowercased = sorted.map((m) => m.toLowerCase())
  // 3) Convert to a JSON string
  const input = JSON.stringify(lowercased)

  // ----------------------------
  // FNV-1a–style "forward" pass
  // ----------------------------
  let hash1 = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    hash1 ^= input.charCodeAt(i)
    // 16777619 is the FNV magic prime
    hash1 = Math.imul(hash1, 16777619)
  }

  // ------------------------------------
  // FNV-1a–style "reverse" pass (optional)
  // ------------------------------------
  let hash2 = 2166136261 >>> 0
  for (let i = input.length - 1; i >= 0; i--) {
    hash2 ^= input.charCodeAt(i)
    hash2 = Math.imul(hash2, 16777619)
  }

  // Combine both 32-bit results into one 64-bit hex string (16 hex chars).
  const part1 = (hash1 >>> 0).toString(16).padStart(8, "0")
  const part2 = (hash2 >>> 0).toString(16).padStart(8, "0")

  return part1 + part2
}

// async function ensureConversationInCache(args: {
//   account: string;
//   topic: IXmtpConversationTopic;
// }) {
//   const MAX_RETRIES = 3;
//   let retries = 0;

//   while (retries < MAX_RETRIES) {
//     const existing = queryClient.getQueryData<ConversationWithCodecsType>(
//       getConversationQueryOptions({
//         account: args.account,
//         topic: args.topic,
//         caller: "ensureConversationInCache",
//       }).queryKey
//     );

//     if (existing) return;

//     await queryClient.refetchQueries({
//       queryKey: getConversationQueryOptions({
//         account: args.account,
//         topic: args.topic,
//         caller: "ensureConversationInCache",
//       }).queryKey,
//     });

//     retries++;
//     if (retries < MAX_RETRIES) {
//       await new Promise((resolve) => setTimeout(resolve, 300));
//     }
//   }

//   throw new Error("Failed to validate conversation in cache");
// }
