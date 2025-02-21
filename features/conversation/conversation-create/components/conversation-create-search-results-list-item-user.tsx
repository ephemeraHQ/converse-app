import { useCallback } from "react";
import { Avatar } from "@/components/avatar";
import { ConversationSearchResultsListItem } from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useAppTheme } from "@/theme/use-app-theme";

type UserSearchResultListItemProps = {
  inboxId: string;
};

export function ConversationSearchResultsListItemUser({
  inboxId,
}: UserSearchResultListItemProps) {
  const { theme } = useAppTheme();

  const { data: profile } = useProfileQuery({
    xmtpId: inboxId,
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
        <Avatar
          name={profile?.name}
          uri={profile?.avatar}
          size={theme.avatarSize.md}
        />
      }
      title={profile?.name ?? " "}
      // TODO: add username/address
      subtitle=""
      onPress={handlePress}
    />
  );
}
