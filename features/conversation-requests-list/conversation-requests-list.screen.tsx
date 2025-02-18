import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { ConversationRequestsToggle } from "@/features/conversation-requests-list/conversation-requests-list-toggle";
import { useConversationRequestsListScreenHeader } from "@/features/conversation-requests-list/conversation-requests-list.screen-header";
import { translate } from "@/i18n";
import { memo, useCallback, useState } from "react";
import { useConversationRequestsListItem } from "./use-conversation-requests-list-items";
import { $globalStyles } from "@/theme/styles";

export const ConversationRequestsListScreen = memo(function () {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useConversationRequestsListScreenHeader();

  const handleToggleSelect = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationRequestsToggle
        options={[translate("You might know"), translate("Hidden")]}
        selectedIndex={selectedIndex}
        onSelect={handleToggleSelect}
      />

      <ConversationListWrapper selectedIndex={selectedIndex} />
    </Screen>
  );
});

const ConversationListWrapper = memo(function ConversationListWrapper({
  selectedIndex,
}: {
  selectedIndex: number;
}) {
  const { likelyNotSpam, likelySpam } = useConversationRequestsListItem();

  return (
    <ConversationList
      conversations={selectedIndex === 0 ? likelyNotSpam : likelySpam}
    />
  );
});
