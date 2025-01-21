import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { ConversationRequestsListSegmentController } from "@/features/conversation-requests-list/conversation-requests-list-segment-controller";
import { useConversationRequestsListScreenHeader } from "@/features/conversation-requests-list/conversation-requests-list.screen-header";
import { translate } from "@/i18n";
import { memo, useCallback, useState } from "react";
import { useConversationRequestsListItem } from "./use-conversation-requests-list-items";

export const ConversationRequestsListScreen = memo(function () {
  console.log("render");
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
  const { likelyNotSpam, likelySpam } = useConversationRequestsListItem();

  return (
    <ConversationList
      conversations={selectedSegment === 0 ? likelyNotSpam : likelySpam}
    />
  );
});
