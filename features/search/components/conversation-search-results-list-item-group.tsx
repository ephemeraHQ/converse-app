import { Avatar } from "@/components/Avatar";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroupQuery } from "@/queries/useGroupQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo, useCallback } from "react";
import { View } from "react-native";
import { searchResultsStyles } from "./search-results.styles";

export const ConversationSearchResultsListItemGroup = memo(
  function ConversationSearchResultsListItemGroup({
    conversationTopic,
  }: {
    conversationTopic: ConversationTopic;
  }) {
    const { theme, themed } = useAppTheme();

    const currentAccount = useCurrentAccount()!;

    const { data: group } = useGroupQuery({
      account: currentAccount,
      topic: conversationTopic,
    });

    const { members } = useGroupMembers(conversationTopic);

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
      <Pressable onPress={handlePress}>
        <View style={themed(searchResultsStyles.$groupContainer)}>
          <Avatar
            uri={group?.imageUrlSquare}
            size={theme.avatarSize.md}
            style={themed(searchResultsStyles.$avatar)}
            name={group?.name}
          />
          <View style={themed(searchResultsStyles.$groupTextContainer)}>
            <Text
              preset="bodyBold"
              style={themed(searchResultsStyles.$primaryText)}
              numberOfLines={1}
            >
              {group?.name}
            </Text>
            <Text
              preset="formLabel"
              style={themed(searchResultsStyles.$secondaryText)}
              numberOfLines={1}
            >
              {members?.ids
                .slice(0, 3)
                .map((id) => members?.byId[id]?.addresses[0])
                .filter((address) => address !== currentAccount)
                .join(", ")}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }
);
