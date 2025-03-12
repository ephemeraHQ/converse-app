import { MutationObserver } from "@tanstack/react-query"
import { StreamError } from "@utils/error"
import { InboxId } from "@xmtp/react-native-sdk"
import { addConversationToAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { addConversationToUnknownConsentConversationsQuery } from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getMarkConversationAsReadMutationOptions } from "@/features/conversation/hooks/use-mark-conversation-as-read"
import { setConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown"
import { ensureGroupMembersQueryData } from "@/features/groups/useGroupMembersQuery"
import { streamConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-stream"
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { streamLogger } from "@/utils/logger"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

export async function startConversationStreaming(args: { clientInboxId: InboxId }) {
  const { clientInboxId } = args

  try {
    await streamConversations({
      inboxId: clientInboxId,
      onNewConversation: (conversation) =>
        handleNewConversation({ clientInboxId, conversation }).catch(captureError),
    })
  } catch (error) {
    throw new StreamError({
      error,
      additionalMessage: `Failed to stream conversations for ${clientInboxId}`,
    })
  }
}

async function handleNewConversation(args: {
  clientInboxId: InboxId
  conversation: IXmtpConversationWithCodecs
}) {
  const { clientInboxId, conversation } = args

  streamLogger.debug(
    `[Stream] Received new conversation for ${clientInboxId}: ${conversation.topic}`,
  )

  // For some reason, when receiving a new conversation, the group members are not available?
  ensureGroupMembersQueryData({
    caller: "handleNewConversation",
    clientInboxId,
    topic: conversation.topic,
  }).catch(captureError)

  if (isConversationAllowed(conversation)) {
    // Create conversation metadata
    const markAsReadMutationObserver = new MutationObserver(
      reactQueryClient,
      getMarkConversationAsReadMutationOptions({
        topic: conversation.topic,
      }),
    )
    markAsReadMutationObserver.mutate().catch(captureError)

    addConversationToAllowedConsentConversationsQuery({
      inboxId: clientInboxId,
      conversation,
    })
  } else if (isConversationConsentUnknown(conversation)) {
    addConversationToUnknownConsentConversationsQuery({
      inboxId: clientInboxId,
      conversation,
    })
  }

  setConversationQueryData({
    inboxId: clientInboxId,
    topic: conversation.topic,
    conversation,
  })

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
