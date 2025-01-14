import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { getV3SpamScore } from "@/data/helpers/conversations/spamScore";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { ConversationRequestsListSegmentController } from "@/features/conversation-requests-list/conversation-requests-list-segment-controller";
import { useConversationRequestsListScreenHeader } from "@/features/conversation-requests-list/conversation-requests-list.screen-header";
import { getMessageStringContent } from "@/features/conversation/conversation-message/conversation-message.utils";
import { translate } from "@/i18n";
import { getUnknownConsentConversationsQueryOptions } from "@/queries/unknown-consent-conversations-query";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { getMessageContentType } from "@/utils/xmtpRN/content-types/content-types";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useState } from "react";

export const ConversationRequestsListScreen = memo(function () {
  const [selectedSegment, setSelectedSegment] = useState(0);

  useConversationRequestsListScreenHeader();

  const handleSegmentChange = useCallback((index: number) => {
    setSelectedSegment(index);
  }, []);

  return (
    <Screen>
      <ConversationRequestsListSegmentController
        options={[translate("you_might_know"), translate("hidden_requests")]}
        selectedIndex={selectedSegment}
        onSelect={handleSegmentChange}
      />

      <ConversationListWrapper selectedSegment={selectedSegment} />
    </Screen>
  );
});

const ConversationListWrapper = memo(function ConversationListWrapper({
  selectedSegment,
}: {
  selectedSegment: number;
}) {
  const { likelyNotSpam, likelySpam } = useRequestsConversations();

  return (
    <ConversationList
      conversations={selectedSegment === 0 ? likelyNotSpam : likelySpam}
    />
  );
});

const useRequestsConversations = () => {
  const currentAccount = useCurrentAccount();

  const [likelyNotSpam, setLikelyNotSpam] = useState<
    ConversationWithCodecsType[]
  >([]);
  const [likelySpam, setLikelySpam] = useState<ConversationWithCodecsType[]>(
    []
  );

  const { data: conversations } = useQuery(
    getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      context: "useRequestsConversations",
    })
  );

  const numberOfConversations = conversations?.length;

  useEffect(() => {
    async function processConversations(
      conversations: ConversationWithCodecsType[]
    ) {
      try {
        const isSpamResults = await Promise.allSettled(
          conversations.map(async (conversation) => {
            try {
              // ! since we check for lastMessage in the select, we can safely assume it's not undefined
              const lastMessage = conversation.lastMessage!;
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
      }
    }

    processConversations(conversations ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfConversations]);

  return { likelyNotSpam, likelySpam };
};
