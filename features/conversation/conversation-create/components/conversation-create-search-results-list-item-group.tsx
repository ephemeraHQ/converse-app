import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo, useCallback } from "react";
import { GroupAvatar } from "@/components/group-avatar";
import { ConversationSearchResultsListItem } from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroupName } from "@/hooks/useGroupName";

export const ConversationSearchResultsListItemGroup = memo(
  function ConversationSearchResultsListItemGroup({
    conversationTopic,
  }: {
    conversationTopic: ConversationTopic;
  }) {
    const { members } = useGroupMembers(conversationTopic);

    const { groupName } = useGroupName({
      conversationTopic,
    });

    const conversationStore = useConversationStore();

    const preferredDisplayData = usePreferredDisplayInfoBatch({
      xmtpInboxIds: members?.ids?.slice(0, 3) ?? [],
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
        subtitle={
          preferredDisplayData
            ?.slice(0, 3)
            .map((profile) => profile?.displayName)
            .join(", ") ?? ""
        }
        onPress={handlePress}
      />
    );
  },
);
