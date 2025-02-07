import { GroupAvatar } from "@/components/group-avatar";
import { ConversationSearchResultsListItem } from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { useInboxesUsername } from "@/features/profiles/utils/inbox-username";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroupNameForCurrentAccount } from "@/hooks/useGroupName";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo, useCallback } from "react";

export const ConversationSearchResultsListItemGroup = memo(
  function ConversationSearchResultsListItemGroup({
    conversationTopic,
  }: {
    conversationTopic: ConversationTopic;
  }) {
    const { members } = useGroupMembers(conversationTopic);

    const { groupName } = useGroupNameForCurrentAccount({
      conversationTopic,
    });

    const conversationStore = useConversationStore();

    const { data: usernames } = useInboxesUsername({
      inboxIds: members?.ids?.slice(0, 3) ?? [],
    });

    const handlePress = useCallback(() => {
      conversationStore.setState({
        searchTextValue: "",
        searchSelectedUserInboxIds: [],
        topic: conversationTopic,
        isCreatingNewConversation: false,
      });
    }, [conversationStore, conversationTopic]);

    return (
      <ConversationSearchResultsListItem
        avatar={<GroupAvatar groupTopic={conversationTopic} />}
        title={groupName}
        subtitle={usernames.slice(0, 3).join(", ") ?? ""}
        onPress={handlePress}
      />
    );
  }
);
