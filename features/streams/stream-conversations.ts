import { MutationObserver } from "@tanstack/react-query";
import { StreamError } from "@utils/error";
import { getMarkConversationAsReadMutationOptions } from "@/features/conversation/hooks/use-mark-conversation-as-read";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import { startMessageStreaming } from "@/features/streams/stream-messages";
import {
  stopStreamingConversations,
  streamConversations,
} from "@/features/xmtp/xmtp-conversations/xmtp-conversations-stream";
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types";
import { setConversationQueryData } from "@/queries/conversation-query";
import { addConversationToAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
import { addConversationToUnknownConsentConversationsQuery } from "@/queries/conversations-unknown-consent-query";
import { queryClient } from "@/queries/queryClient";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";

export async function startConversationStreaming(ethAddress: string) {
  try {
    await streamConversations({
      ethAddress: ethAddress,
      onNewConversation: (conversation) =>
        handleNewConversation({ account: ethAddress, conversation }).catch(
          captureError,
        ),
    });
  } catch (error) {
    captureError(
      new StreamError(
        `Failed to stream conversations for ${ethAddress}`,
        error,
      ),
    );
  }
}

export { stopStreamingConversations };

async function handleNewConversation(args: {
  account: string;
  conversation: IXmtpConversationWithCodecs;
}) {
  const { account, conversation } = args;

  // For some reason, when receiving a new conversation, the group members are not available?
  ensureGroupMembersQueryData({
    caller: "handleNewConversation",
    account,
    topic: conversation.topic,
  }).catch(captureError);

  if (isConversationAllowed(conversation)) {
    // Create conversation metadata
    const markAsReadMutationObserver = new MutationObserver(
      queryClient,
      getMarkConversationAsReadMutationOptions({
        topic: conversation.topic,
      }),
    );
    markAsReadMutationObserver.mutate().catch(captureError);

    addConversationToAllowedConsentConversationsQuery({
      account,
      conversation,
    });

    // This is a temporary workaround related to https://github.com/xmtp/xmtp-react-native/issues/560
    startMessageStreaming({ account });
  } else if (isConversationConsentUnknown(conversation)) {
    addConversationToUnknownConsentConversationsQuery({
      account,
      conversation,
    });
  }

  setConversationQueryData({
    account,
    topic: conversation.topic,
    conversation,
  });

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
