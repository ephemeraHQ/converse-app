import { getV3SpamScore } from "@/data/helpers/conversations/spamScore";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { getMessageStringContent } from "@/features/conversation/conversation-message/conversation-message.utils";
import { getUnknownConsentConversationsQueryOptions } from "@/queries/unknown-consent-conversations-query";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { getMessageContentType } from "@/utils/xmtpRN/content-types/content-types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// TODO: Put in react query

export const useConversationRequestsListItem = () => {
  const currentAccount = useCurrentAccount();
  const [isProcessingConversations, setIsProcessingConversations] =
    useState(false);

  const [likelyNotSpam, setLikelyNotSpam] = useState<
    ConversationWithCodecsType[]
  >([]);
  const [likelySpam, setLikelySpam] = useState<ConversationWithCodecsType[]>(
    []
  );

  const { data: conversations, isLoading: isLoadingConversations } = useQuery(
    getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      context: "useConversationRequestsListItem",
    })
  );

  const numberOfConversations = conversations?.length;

  useEffect(() => {
    async function processConversations(
      conversations: ConversationWithCodecsType[]
    ) {
      try {
        setIsProcessingConversations(true);
        const isSpamResults = await Promise.allSettled(
          conversations.map(async (conversation) => {
            try {
              const lastMessage = conversation.lastMessage;

              if (!lastMessage) {
                return true;
              }

              const messageText = getMessageStringContent(lastMessage);

              if (!messageText) {
                return true;
              }

              // Get spam score
              const contentType = getMessageContentType(
                lastMessage.contentTypeId!
              );

              if (!contentType) {
                return true;
              }

              const spamScore = await getV3SpamScore({
                messageText: messageText,
                contentType,
              });

              if (spamScore === 0) {
                return false;
              }

              return true;
            } catch (error) {
              captureError(error);
              return true;
            }
          })
        );

        const notSpams: ConversationWithCodecsType[] = [];
        const spams: ConversationWithCodecsType[] = [];

        isSpamResults.forEach((result, index) => {
          if (result.status !== "fulfilled") {
            return;
          }
          const conversation = conversations[index];
          const isSpam = result.value;
          if (isSpam) {
            spams.push(conversation);
          } else {
            notSpams.push(conversation);
          }
        });

        setLikelyNotSpam(notSpams);
        setLikelySpam(spams);
      } catch (error) {
        captureErrorWithToast(error);
      } finally {
        // Default to putting all conversations in likelySpam if we have an error
        setLikelySpam(conversations);
        setIsProcessingConversations(false);
      }
    }

    processConversations(conversations ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfConversations]);

  const isLoading = isLoadingConversations || isProcessingConversations;

  return { likelyNotSpam, likelySpam, isLoading };
};
