import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { ConversationRequestsListSegmentController } from "@/features/conversation-requests-list/conversation-requests-list-segment-controller";
import { useConversationRequestsListScreenHeader } from "@/features/conversation-requests-list/conversation-requests-list.screen-header";
import { translate } from "@/i18n";
import { memo, useCallback, useState } from "react";
import { useConversationRequestsListItem } from "./use-conversation-requests-list-items";
import { $globalStyles } from "@/theme/styles";

export const ConversationRequestsListScreen = memo(function () {
  const [selectedSegment, setSelectedSegment] = useState(0);

  useConversationRequestsListScreenHeader();

  const handleSegmentChange = useCallback((index: number) => {
    setSelectedSegment(index);
  }, []);

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationRequestsListSegmentController
        options={[translate("You might know"), translate("Hidden requests")]}
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
