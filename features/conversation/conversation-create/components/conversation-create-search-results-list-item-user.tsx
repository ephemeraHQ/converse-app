import { Avatar } from "@/components/Avatar";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { useInboxUsername } from "@/features/profiles/utils/inbox-username";
import { ConversationSearchResultsListItem } from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { useAppTheme } from "@/theme/useAppTheme";
import { shortAddress } from "@/utils/strings/shortAddress";
import { useCallback } from "react";

type UserSearchResultListItemProps = {
  inboxId: string;
};

export function ConversationSearchResultsListItemUser({
  inboxId,
}: UserSearchResultListItemProps) {
  const { theme } = useAppTheme();

  const { data: preferredName } = usePreferredInboxName({
    inboxId,
  });

  const { data: preferredAvatar } = usePreferredInboxAvatar({
    inboxId,
  });

  const { data: username } = useInboxUsername({
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
        <Avatar
          uri={preferredAvatar}
          size={theme.avatarSize.md}
          name={preferredName}
        />
      }
      title={preferredName}
      subtitle={username || shortAddress(inboxId)}
      onPress={handlePress}
    />
  );
}
