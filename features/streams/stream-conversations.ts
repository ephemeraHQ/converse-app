import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { MutationObserver } from "@tanstack/react-query"
import { StreamError } from "@utils/error"
import { addConversationToAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { addConversationToUnknownConsentConversationsQuery } from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getMarkConversationAsReadMutationOptions } from "@/features/conversation/hooks/use-mark-conversation-as-read"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { streamConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-stream"
import { captureError } from "@/utils/capture-error"
import { streamLogger } from "@/utils/logger"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { IConversation } from "../conversation/conversation.types"

export async function startConversationStreaming(args: { clientInboxId: IXmtpInboxId }) {
  const { clientInboxId } = args

  try {
    await streamConversations({
      inboxId: clientInboxId,
      onNewConversation: async (conversation) =>
        handleNewConversation({
          clientInboxId,
          conversation: await convertXmtpConversationToConvosConversation(conversation),
        }).catch(captureError),
    })
  } catch (error) {
    throw new StreamError({
      error,
      additionalMessage: `Failed to stream conversations for ${clientInboxId}`,
    })
  }
}

async function handleNewConversation(args: {
  clientInboxId: IXmtpInboxId
  conversation: IConversation
}) {
  const { clientInboxId, conversation } = args

  streamLogger.debug(
    `[Stream] Received new conversation for ${clientInboxId}: ${conversation.xmtpTopic}`,
  )

  // If we created the conversation, we don't need to update stuff because we do it in the mutation

  const skipUpdate = isConversationDm(conversation)
    ? conversation.peerInboxId === clientInboxId
    : conversation.creatorInboxId === clientInboxId

  if (skipUpdate) {
    streamLogger.debug(
      `[Stream] Skipping update for conversation ${conversation.xmtpTopic} because we created it`,
    )
    return
  }

  if (isConversationAllowed(conversation)) {
    // Create conversation metadata
    const markAsReadMutationObserver = new MutationObserver(
      reactQueryClient,
      getMarkConversationAsReadMutationOptions({
        xmtpConversationId: conversation.xmtpId,
      }),
    )
    markAsReadMutationObserver.mutate().catch(captureError)

    addConversationToAllowedConsentConversationsQuery({
      clientInboxId,
      conversation,
    })
  } else if (isConversationConsentUnknown(conversation)) {
    addConversationToUnknownConsentConversationsQuery({
      inboxId: clientInboxId,
      conversation,
    })
  }

  /**
   * Maybe replace the optimistic conversation with the real one
   */
  // if (isConversationDm(conversation)) {
  //   Promise.all([
  //     ensureInboxId({ account }),
  //     ensureDmPeerInboxIdQueryData({
  //       account,
  //       topic: conversation.topic,
  //       caller: "handleNewConversation",
  //     }),
  //   ]).then(([inboxId, peerInboxId]) =>
  //     maybeReplaceOptimisticConversationWithReal({
  //       ethAccountAddress: account,
  //       memberInboxIds: [inboxId, peerInboxId],
  //       realTopic: conversation.topic,
  //     })
  //   );
  // } else {
  //   ensureGroupMembersQueryData({
  //     account,
  //     topic: conversation.topic,
  //   })
  //     .then((members) =>
  //       maybeReplaceOptimisticConversationWithReal({
  //         ethAccountAddress: account,
  //         memberInboxIds: members.ids,
  //         realTopic: conversation.topic,
  //       })
  //     )
  // .catch(captureError);
  // }
}
