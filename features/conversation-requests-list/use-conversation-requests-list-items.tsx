import { getV3SpamScore } from "@/data/helpers/conversations/spamScore";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { getMessageStringContent } from "@/features/conversation/conversation-message/conversation-message.utils";
import { getUnknownConsentConversationsQueryOptions } from "@/queries/unknown-consent-conversations-query";
import { captureError } from "@/utils/capture-error";
import { getMessageContentType } from "@/utils/xmtpRN/content-types/content-types";
import { useQueries, useQuery } from "@tanstack/react-query";

export function useConversationRequestsListItem() {
  const currentAccount = useCurrentAccount();

  const {
    data: unkownConsentConversations,
    isLoading: unkownConsentConversationsLoading,
  } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
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

        const contentType = getMessageContentType(lastMessage.contentTypeId!);
        if (!contentType) {
          return true;
        }

        try {
          const spamScore = await getV3SpamScore({
            messageText,
            contentType,
          });
          return spamScore !== 0;
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
            r.conversation!
        ) ?? [],
    likelySpam:
      spamResults
        .filter((r) => r.isSpam)
        .map(
          (r) =>
            // ! because we do .filter above
            r.conversation!
        ) ?? [],
    isLoading,
  };
}
