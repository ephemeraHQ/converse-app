import { useCallback } from "react";
import { Avatar } from "@/components/avatar";
import { ConversationSearchResultsListItem } from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info";
import { useAppTheme } from "@/theme/use-app-theme";

type UserSearchResultListItemProps = {
  inboxId: string;
};

export function ConversationSearchResultsListItemUser({
  inboxId,
}: UserSearchResultListItemProps) {
  const { theme } = useAppTheme();
  const { displayName, avatarUrl, username } = usePreferredDisplayInfo({
    inboxId,
  });
  const conversationStore = useConversationStore();

  const handlePress = useCallback(() => {
    conversationStore.setState({
      searchTextValue: "",
      searchSelectedUserInboxIds: [
        ...(conversationStore.getState().searchSelectedUserInboxIds ?? []),
        inboxId!,
      ],
    });
  }, [conversationStore, inboxId]);

  return (
    <ConversationSearchResultsListItem
      avatar={
        <Avatar name={displayName} uri={avatarUrl} size={theme.avatarSize.md} />
      }
      title={displayName ?? " "}
      subtitle={username ?? ""}
      onPress={handlePress}
    />
  );
}
