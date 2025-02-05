import { GroupAvatar } from "@/components/group-avatar";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { ConversationSearchResultsListItem } from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
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
    const currentAccount = useCurrentAccount()!;

    const { members } = useGroupMembers(conversationTopic);

    const { groupName } = useGroupNameForCurrentAccount({
      conversationTopic,
    });

    const conversationStore = useConversationStore();

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
        subtitle={
          members?.ids
            .slice(0, 3)
            .map((id) => members?.byId[id]?.addresses[0])
            .filter((address) => address !== currentAccount)
            .join(", ") ?? ""
        }
        onPress={handlePress}
      />
    );
  }
);
