import { useQueries, useQuery } from "@tanstack/react-query";
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store";
import { getMessageSpamScore } from "@/features/conversation-requests-list/utils/get-message-spam-score";
import { getMessageStringContent } from "@/features/conversation/conversation-message/conversation-message.utils";
import { getUnknownConsentConversationsQueryOptions } from "@/queries/conversations-unknown-consent-query";
import { captureError } from "@/utils/capture-error";

export function useConversationRequestsListItem() {
  const currentAccount = useCurrentSenderEthAddress();

  const {
    data: unkownConsentConversations,
    isLoading: unkownConsentConversationsLoading,
  } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      caller: "useConversationRequestsListItem",
    }),
  });

  const spamQueries = useQueries({
    queries: (unkownConsentConversations ?? []).map((conversation) => ({
      queryKey: ["is-spam", conversation.topic],
      queryFn: async () => {
        const lastMessage = conversation.lastMessage;

        if (!lastMessage) {
          return true;
        }

        const messageText = getMessageStringContent(lastMessage);

        if (!messageText) {
          return true;
        }

        try {
          const spamScore = await getMessageSpamScore({
            message: lastMessage,
          });
          const isSpam = spamScore !== 0;
          return isSpam;
        } catch (error) {
          captureError(error);
          return true;
        }
      },
      enabled: !!conversation.lastMessage,
    })),
  });

  const isLoading =
    unkownConsentConversationsLoading || spamQueries.some((q) => q.isLoading);

  const spamResults = spamQueries
    .map((q, i) => ({
      conversation: unkownConsentConversations?.[i],
      isSpam: q.data ?? true,
    }))
    .filter((r) => !!r.conversation);

  return {
    likelyNotSpam:
      spamResults
        .filter((r) => !r.isSpam)
        .map(
          (r) =>
            // ! because we do .filter above
            r.conversation!,
        ) ?? [],
    likelySpam:
      spamResults
        .filter((r) => r.isSpam)
        .map(
          (r) =>
            // ! because we do .filter above
            r.conversation!,
        ) ?? [],
    isLoading,
  };
}
