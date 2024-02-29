import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useEffect, useRef } from "react";
import { Platform, View, useColorScheme, StyleSheet } from "react-native";

import {
  useChatStore,
  useCurrentAccount,
  useSettingsStore,
} from "../data/store/accountsStore";
import { useSelect } from "../data/store/storeHelpers";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { useIsSplitScreen } from "../screens/Navigation/navHelpers";
import { backgroundColor } from "../utils/colors";
import {
  ConversationFlatListItem,
  ConversationWithLastMessagePreview,
} from "../utils/conversation";
import { conversationName } from "../utils/str";
import ConversationListItem from "./ConversationListItem";

type Props = {
  onScroll?: () => void;
  items: ConversationFlatListItem[];
  itemsForSearchQuery?: string;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
} & NativeStackScreenProps<NavigationParamList, any>;

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
  const { lastUpdateAt, initialLoadDoneOnce, openedConversationTopic } =
    useChatStore(
      useSelect([
        "lastUpdateAt",
        "initialLoadDoneOnce",
        "openedConversationTopic",
      ])
    );
  const userAddress = useCurrentAccount() as string;
  const peersStatus = useSettingsStore((s) => s.peersStatus);
  const isSplitScreen = useIsSplitScreen();

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
      return (
        <ConversationListItem
          navigation={navigation}
          conversationPeerAddress={conversation.peerAddress}
          colorScheme={colorScheme}
          conversationTopic={conversation.topic}
          conversationTime={
            lastMessagePreview?.message?.sent || conversation.createdAt
          }
          conversationName={conversationName(conversation)}
          showUnread={
            !!(
              initialLoadDoneOnce &&
              lastMessagePreview &&
              conversation.readUntil < lastMessagePreview.message.sent &&
              lastMessagePreview.message.senderAddress ===
                conversation.peerAddress
            )
          }
          lastMessagePreview={
            peersStatus[conversation.peerAddress.toLowerCase()] === "blocked"
              ? "This user is blocked"
              : lastMessagePreview
              ? lastMessagePreview.contentPreview
              : ""
          }
          lastMessageStatus={lastMessagePreview?.message?.status}
          lastMessageFromMe={
            !!lastMessagePreview &&
            lastMessagePreview.message?.senderAddress === userAddress
          }
          conversationOpened={conversation.topic === openedConversationTopic}
        />
      );
    },
    [
      colorScheme,
      initialLoadDoneOnce,
      navigation,
      openedConversationTopic,
      peersStatus,
      userAddress,
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
