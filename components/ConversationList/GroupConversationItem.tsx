import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FC, useCallback } from "react";
import { useColorScheme } from "react-native";

import {
  useChatStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useGroupName } from "../../hooks/useGroupName";
import { useGroupPhoto } from "../../hooks/useGroupPhoto";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { ConversationWithLastMessagePreview } from "../../utils/conversation";
import { conversationName } from "../../utils/str";
import ConversationListItem from "../ConversationListItem";

interface GroupConversationItemProps
  extends NativeStackScreenProps<
    NavigationParamList,
    "Chats" | "ShareFrame" | "ChatsRequests"
  > {
  conversation: ConversationWithLastMessagePreview;
}

export const GroupConversationItem: FC<GroupConversationItemProps> = ({
  navigation,
  route,
  conversation,
}) => {
  const topic = conversation.topic;
  const lastMessagePreview = conversation.lastMessagePreview;
  const { groupName } = useGroupName(topic);
  const { groupPhoto } = useGroupPhoto(topic);
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount() as string;
  const { initialLoadDoneOnce, openedConversationTopic, topicsData } =
    useChatStore(
      useSelect([
        "lastUpdateAt",
        "initialLoadDoneOnce",
        "openedConversationTopic",
        "topicsData",
      ])
    );
  const setPinnedConversations = useChatStore(
    (state) => state.setPinnedConversations
  );

  const onLongPress = useCallback(() => {
    setPinnedConversations([conversation]);
  }, [setPinnedConversations, conversation]);

  return (
    <ConversationListItem
      onLongPress={onLongPress}
      navigation={navigation}
      route={route}
      conversationPeerAddress={conversation.peerAddress}
      conversationPeerAvatar={groupPhoto}
      colorScheme={colorScheme}
      conversationTopic={conversation.topic}
      conversationTime={
        lastMessagePreview?.message?.sent || conversation.createdAt
      }
      conversationName={groupName ? groupName : conversationName(conversation)}
      showUnread={(() => {
        if (!initialLoadDoneOnce) return false;
        if (!lastMessagePreview) return false;
        // Manually marked as unread
        if (topicsData[conversation.topic]?.status === "unread") return true;
        // If not manually markes as unread, we only show badge if last message
        // not from me
        if (lastMessagePreview.message.senderAddress === userAddress)
          return false;
        const readUntil = topicsData[conversation.topic]?.readUntil || 0;
        return readUntil < lastMessagePreview.message.sent;
      })()}
      lastMessagePreview={
        lastMessagePreview ? lastMessagePreview.contentPreview : ""
      }
      lastMessageStatus={lastMessagePreview?.message?.status}
      lastMessageFromMe={
        !!lastMessagePreview &&
        lastMessagePreview.message?.senderAddress === userAddress
      }
      conversationOpened={conversation.topic === openedConversationTopic}
    />
  );
};
