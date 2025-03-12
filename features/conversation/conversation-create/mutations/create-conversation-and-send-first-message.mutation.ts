import { useMutation } from "@tanstack/react-query"
import { ConversationTopic, MessageId, RemoteAttachmentContent } from "@xmtp/react-native-sdk"
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getConversationMessagesQueryData,
  setConversationMessagesQueryData,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import {
  getConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { createXmtpDm } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-dm"
import { createXmtpGroup } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { IXmtpDmWithCodecs, IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"
import { sendMessage } from "../../hooks/use-send-message"

export type ISendMessageParams = {
  topic: ConversationTopic
  referencedMessageId?: MessageId
  content:
    | { text: string; remoteAttachment?: RemoteAttachmentContent }
    | { text?: string; remoteAttachment: RemoteAttachmentContent }
}

export type ISendFirstMessageParams = Omit<ISendMessageParams, "topic">

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

function getConversationTempTopic(args: { inboxIds: InboxId[] }) {
  const { inboxIds } = args
  return `${TEMP_CONVERSATION_PREFIX}${generateGroupHashFromMemberIds(
    inboxIds,
  )}` as ConversationTopic
}

export function useCreateConversationAndSendFirstMessage() {
  // const conversationStore = useConversationStore()

  return useMutation({
    mutationFn: async (args: { inboxIds: InboxId[]; content: { text: string } }) => {
      const { inboxIds, content } = args

      if (!inboxIds.length) {
        throw new Error("No inboxIds provided")
      }

      const currentSender = getSafeCurrentSender()

      // Create conversation
      let conversation: IXmtpGroupWithCodecs | IXmtpDmWithCodecs
      if (inboxIds.length > 1) {
        conversation = await createXmtpGroup({
          clientInboxId: currentSender.inboxId,
          inboxIds,
        })
      } else {
        conversation = await createXmtpDm({
          senderClientInboxId: currentSender.inboxId,
          peerInboxId: inboxIds[0],
        })
      }

      // Send message
      const messageId = await sendMessage({
        topic: conversation.topic,
        content,
      })

      return { conversation, messageId }
    },
    // onMutate: ({ inboxIds, content }) => {
    //   const currentAccountInboxId = getSafeCurrentSender().inboxId;
    //   const currentAccount = getCurrentAccount()!;

    //   logger.debug(
    //     `[useCreateConversationAndSendFirstMessage] Creating optimistic conversation with currentAccount: ${currentAccount} and currentAccountInboxId: ${currentAccountInboxId}`
    //   );

    //   const isGroup = inboxIds.length > 1;
    //   const tempTopic = getConversationTempTopic({
    //     inboxIds: [currentAccountInboxId, ...inboxIds],
    //   });

    //   logger.debug(
    //     `[useCreateConversationAndSendFirstMessage] Generated tempTopic: ${tempTopic}, isGroup: ${isGroup}`
    //   );

    //   // Create optimistic conversation
    //   let tempConversation: GroupWithCodecsType | DmWithCodecsType;

    //   // Group
    //   if (isGroup) {
    //     logger.debug(
    //       `[useCreateConversationAndSendFirstMessage] Creating optimistic group conversation`
    //     );
    //     const groupParams: GroupParams = {
    //       id: "" as unknown as ConversationId,
    //       createdAt: 0,
    //       topic: tempTopic,
    //       name: "",
    //       isActive: true,
    //       addedByInboxId: currentAccountInboxId,
    //       groupImageUrl: "",
    //       description: "",
    //       consentState: "allowed",
    //     };

    //     tempConversation = new Group(
    //       "" as unknown as InstallationId,
    //       groupParams,
    //       undefined
    //     );

    //     logger.debug(
    //       `[useCreateConversationAndSendFirstMessage] Setting group query data for topic: ${tempTopic}`
    //     );
    //     setGroupQueryData({
    //       account: currentAccount,
    //       topic: tempTopic,
    //       group: tempConversation as GroupWithCodecsType,
    //     });
    //   }
    //   // DM
    //   else {
    //     logger.debug(
    //       `[useCreateConversationAndSendFirstMessage] Creating optimistic DM conversation with peer: ${inboxIds[0]}`
    //     );
    //     const dmParams: DmParams = {
    //       id: "" as unknown as ConversationId,
    //       createdAt: 0,
    //       topic: tempTopic,
    //       consentState: "allowed",
    //     };

    //     tempConversation = new Dm(
    //       "" as unknown as InstallationId,
    //       dmParams,
    //       undefined
    //     );

    //     logger.debug(
    //       `[useCreateConversationAndSendFirstMessage] Setting DM query data for topic: ${tempTopic}`
    //     );

    //     setDmQueryData({
    //       ethAccountAddress: currentAccount,
    //       inboxId: inboxIds[0],
    //       dm: tempConversation as Dm<SupportedCodecsType>,
    //     });
    //   }

    //   conversationStore.setState({
    //     topic: tempTopic,
    //   });

    //   // addConversationToAllowedConsentConversationsQuery({
    //   //   account: currentAccount,
    //   //   conversation: tempConversation,
    //   // });

    //   // Create optimistic message
    //   const generatedMessageId = getRandomId();
    //   const optimisticMessage = DecodedMessage.fromObject({
    //     id: generatedMessageId as MessageId,
    //     topic: tempTopic as unknown as ConversationTopic,
    //     contentTypeId: contentTypesPrefixes.text,
    //     senderInboxId: currentAccountInboxId,
    //     sentNs: getTodayNs(),
    //     content: { text: content.text },
    //     fallback: content.text,
    //     deliveryStatus: "sending" as MessageDeliveryStatus,
    //   });

    //   addConversationMessageQuery({
    //     account: currentAccount,
    //     topic: tempTopic as unknown as ConversationTopic,
    //     message: optimisticMessage,
    //   });

    //   return { generatedMessageId, tempTopic };
    // },
    // onSuccess: (result, variables, context) => {
    //   const { inboxIds } = variables;

    //   if (!context) return;

    //   const currentAccount = getCurrentAccount()!;
    //   const isGroup = inboxIds.length > 1;
    //   const { conversation, messageId } = result;

    //   // Update conversation
    //   removeConversationFromAllowedConsentConversationsQuery({
    //     account: currentAccount,
    //     topic: context.tempTopic,
    //   });

    //   addConversationToAllowedConsentConversationsQuery({
    //     account: currentAccount,
    //     conversation,
    //   });

    //   replaceOptimisticConversationWithReal({
    //     account: currentAccount,
    //     tempTopic: context.tempTopic!,
    //     realTopic: conversation.topic,
    //   });

    //   if (!isGroup) {
    //     setDmQueryData({
    //       ethAccountAddress: currentAccount,
    //       inboxId: inboxIds[0],
    //       dm: conversation as Dm<SupportedCodecsType>,
    //     });
    //   }

    //   // Update message
    //   if (context.generatedMessageId) {
    //     replaceOptimisticMessageWithReal({
    //       tempId: context.generatedMessageId,
    //       topic: context.tempTopic as unknown as ConversationTopic,
    //       account: currentAccount,
    //       realMessage: {
    //         id: messageId,
    //         content: () => variables.content.text,
    //         contentTypeId: contentTypesPrefixes.text,
    //         sentNs: getTodayNs(),
    //         fallback: "new-message",
    //         deliveryStatus: "sent" as MessageDeliveryStatus,
    //         topic: context.tempTopic as unknown as ConversationTopic,
    //         senderInboxId: currentAccount,
    //         nativeContent: { text: variables.content.text },
    //       } as DecodedMessage,
    //     });
    //   }
    // },
    // onError: (error, variables, context) => {
    //   if (context?.tempTopic) {
    //     const currentAccount = getCurrentAccount()!;
    //     queryClient.removeQueries({
    //       queryKey: conversationMessagesQueryKey(
    //         currentAccount,
    //         context.tempTopic as ConversationTopic
    //       ),
    //     });
    //     queryClient.setQueryData(
    //       allowedConsentConversationsQueryKey(currentAccount),
    //       (previous: ConversationWithCodecsType[] = []) =>
    //         previous.filter((conv) => conv.topic !== context.tempTopic)
    //     );
    //   }
    //   sentryTrackError(error);
    // },
  })
}

export function maybeReplaceOptimisticConversationWithReal(args: {
  clientInboxId: InboxId
  memberInboxIds: InboxId[]
  realTopic: ConversationTopic
}) {
  const { clientInboxId, memberInboxIds, realTopic } = args

  const tempTopic = getConversationTempTopic({
    inboxIds: memberInboxIds,
  })

  const realConversation = getConversationQueryData({
    inboxId: clientInboxId,
    topic: realTopic,
  })

  if (!realConversation) {
    throw new Error("Real conversation not found")
  }

  updateConversationQueryData({
    inboxId: clientInboxId,
    topic: tempTopic,
    conversationUpdate: realConversation,
  })

  // Now move the messages from the temp conversation to the real conversation
  const messages = getConversationMessagesQueryData({
    clientInboxId: clientInboxId,
    topic: tempTopic,
  })

  if (messages) {
    setConversationMessagesQueryData({
      clientInboxId: clientInboxId,
      topic: realTopic,
      data: messages,
    })
  }

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
}

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
function generateGroupHashFromMemberIds(members: InboxId[]) {
  if (!members.length) {
    return undefined
  }

  // 1) Sort members (case-insensitive) and deduplicate
  const sorted = [...new Set(members)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  )
  // 2) Lowercase them
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
//   topic: ConversationTopic;
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
