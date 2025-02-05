import { maybeReplaceOptimisticConversationWithReal } from "@/features/conversation/conversation-create/use-create-conversation-and-send-first-message";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { startMessageStreaming } from "@/features/streams/stream-messages";
import { setConversationQueryData } from "@/queries/conversation-query";
import { addConversationToAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
import { addConversationToUnknownConsentConversationsQuery } from "@/queries/conversations-unknown-consent-query";
import { ensureInboxId } from "@/queries/inbox-id-query";
import { ensureDmPeerInboxIdQueryData } from "@/queries/use-dm-peer-inbox-id-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import {
  stopStreamingConversations,
  streamConversations,
} from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { StreamError } from "@utils/error";

export async function startConversationStreaming(account: string) {
  try {
    await streamConversations({
      ethAddress: account,
      onNewConversation: (conversation) =>
        handleNewConversation({ account, conversation }).catch(captureError),
    });
  } catch (error) {
    captureError(
      new StreamError(`Failed to stream conversations for ${account}`, error)
    );
  }
}

export { stopStreamingConversations };

async function handleNewConversation(args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) {
  const { account, conversation } = args;

  if (isConversationAllowed(conversation)) {
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

  ensureGroupMembersQueryData({
    account,
    topic: conversation.topic,
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
