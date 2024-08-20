import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { backgroundColor } from "@styles/colors";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { GroupConversationItem } from "./ConversationList/GroupConversationItem";
import ConversationListItem from "./ConversationListItem";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { useSelect } from "../data/store/storeHelpers";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { useIsSplitScreen } from "../screens/Navigation/navHelpers";
import {
  ConversationFlatListItem,
  ConversationWithLastMessagePreview,
} from "../utils/conversation";
import { getPreferredAvatar } from "../utils/profile";
import { conversationName } from "../utils/str";

type Props = {
  onScroll?: () => void;
  items: ConversationFlatListItem[];
  itemsForSearchQuery?: string;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
} & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked"
>;

export default function ConversationFlashList({
  onScroll,
  navigation,
  route,
  items,
  itemsForSearchQuery,
  ListHeaderComponent,
  ListFooterComponent,
}: Props) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const {
    lastUpdateAt,
    initialLoadDoneOnce,
    openedConversationTopic,
    topicsData,
  } = useChatStore(
    useSelect([
      "lastUpdateAt",
      "initialLoadDoneOnce",
      "openedConversationTopic",
      "topicsData",
    ])
  );
  const userAddress = useCurrentAccount() as string;
  const peersStatus = useSettingsStore((s) => s.peersStatus);
  const isSplitScreen = useIsSplitScreen();
  const profiles = useProfilesStore((state) => state.profiles);

  const setPinnedConversations = useChatStore(
    (state) => state.setPinnedConversations
  );

  const listRef = useRef<FlashList<any> | undefined>();

  const previousSearchQuery = useRef(itemsForSearchQuery);

  useEffect(() => {
    // In Split screen, when we click on a convo with search active
    // the search clears and the selected convo may be out of screen
    // so we scroll back to it
    if (
      isSplitScreen &&
      previousSearchQuery.current &&
      !itemsForSearchQuery &&
      openedConversationTopic
    ) {
      const topicIndex = items.findIndex(
        (c) => c.topic === openedConversationTopic
      );
      if (topicIndex === -1) return;
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: topicIndex,
          viewPosition: 0.5,
        });
      }, 10);
    }
    previousSearchQuery.current = itemsForSearchQuery;
  }, [isSplitScreen, items, openedConversationTopic, itemsForSearchQuery]);

  const keyExtractor = useCallback((item: ConversationFlatListItem) => {
    return item.topic;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ConversationFlatListItem }) => {
      const conversation = item as ConversationWithLastMessagePreview;
      const lastMessagePreview = conversation.lastMessagePreview;
      const socials = conversation.peerAddress
        ? profiles[conversation.peerAddress]?.socials
        : undefined;
      if (conversation.isGroup) {
        return (
          <GroupConversationItem
            conversation={conversation}
            navigation={navigation}
            route={route}
          />
        );
      }
      return (
        <ConversationListItem
          onLongPress={() => {
            setPinnedConversations([conversation]);
          }}
          navigation={navigation}
          route={route}
          conversationPeerAddress={conversation.peerAddress}
          conversationPeerAvatar={getPreferredAvatar(socials)}
          colorScheme={colorScheme}
          conversationTopic={conversation.topic}
          conversationTime={
            lastMessagePreview?.message?.sent || conversation.createdAt
          }
          conversationName={conversationName(conversation)}
          showUnread={(() => {
            if (!initialLoadDoneOnce) return false;
            if (!lastMessagePreview) return false;
            // Manually marked as unread
            if (topicsData[conversation.topic]?.status === "unread")
              return true;
            // If not manually markes as unread, we only show badge if last message
            // not from me
            if (lastMessagePreview.message.senderAddress === userAddress)
              return false;
            const readUntil = topicsData[conversation.topic]?.readUntil || 0;
            return readUntil < lastMessagePreview.message.sent;
          })()}
          lastMessagePreview={
            conversation.peerAddress &&
            peersStatus[conversation.peerAddress.toLowerCase()] === "blocked"
              ? "This user is blocked"
              : lastMessagePreview
              ? lastMessagePreview.contentPreview
              : ""
          }
          lastMessageImageUrl={lastMessagePreview?.imageUrl}
          lastMessageStatus={lastMessagePreview?.message?.status}
          lastMessageFromMe={
            !!lastMessagePreview &&
            lastMessagePreview.message?.senderAddress === userAddress
          }
          conversationOpened={conversation.topic === openedConversationTopic}
          isGroupConversation={conversation.isGroup}
        />
      );
    },
    [
      colorScheme,
      initialLoadDoneOnce,
      navigation,
      openedConversationTopic,
      peersStatus,
      route,
      topicsData,
      userAddress,
      profiles,
      setPinnedConversations,
    ]
  );
  return (
    <View style={styles.container}>
      <View style={styles.conversationList}>
        <FlashList
          keyboardShouldPersistTaps="handled"
          onMomentumScrollBegin={onScroll}
          onScrollBeginDrag={onScroll}
          alwaysBounceVertical={items.length > 0}
          contentInsetAdjustmentBehavior="automatic"
          data={items}
          extraData={[
            colorScheme,
            navigation,
            route,
            userAddress,
            initialLoadDoneOnce,
            lastUpdateAt,
          ]}
          ref={(r) => {
            if (r) {
              listRef.current = r;
            }
          }}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={Platform.OS === "ios" ? 77 : 88}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
        />
      </View>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    conversationList: {
      flex: 1,
    },
  });
};
