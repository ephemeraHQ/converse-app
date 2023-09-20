import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  ScrollView,
} from "react-native";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";

import NewConversationButton from "../components/ConversationList/NewConversationButton";
import ConversationListItem from "../components/ConversationListItem";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import Recommendations from "../components/Recommendations/Recommendations";
import NoResult from "../components/Search/NoResult";
import Welcome from "../components/Welcome";
import {
  useChatStore,
  useSettingsStore,
  useUserStore,
  useProfilesStore,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import {
  textPrimaryColor,
  backgroundColor,
  itemSeparatorColor,
} from "../utils/colors";
import {
  LastMessagePreview,
  sortAndComputePreview,
  getConversationListItemsToDisplay,
} from "../utils/conversation";
import { converseEventEmitter } from "../utils/events";
import { pick } from "../utils/objects";
import { conversationName } from "../utils/str";
import { useHeaderSearchBar } from "./Navigation/ConversationListNav";

type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

function ConversationList({
  navigation,
  route,
  searchBarRef,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const {
    conversations,
    lastUpdateAt,
    searchQuery,
    searchBarFocused,
    deletedTopics,
    initialLoadDoneOnce,
  } = useChatStore((s) =>
    pick(s, [
      "initialLoadDoneOnce",
      "conversations",
      "lastUpdateAt",
      "searchQuery",
      "searchBarFocused",
      "deletedTopics",
    ])
  );
  const { blockedPeers, ephemeralAccount } = useSettingsStore((s) =>
    pick(s, ["blockedPeers", "ephemeralAccount"])
  );
  const userAddress = useUserStore((s) => s.userAddress);
  const profiles = useProfilesStore((state) => state.profiles);
  const [flatListItems, setFlatListItems] = useState<FlatListItem[]>([]);
  const [sortedConversations, setSortedConversations] = useState<
    ConversationWithLastMessagePreview[]
  >([]);

  // Display logic
  const showInitialLoad = !initialLoadDoneOnce && flatListItems.length <= 1;
  const showNoResult = flatListItems.length === 0 && searchQuery;

  // Welcome screen
  const showWelcome =
    !searchQuery && !searchBarFocused && sortedConversations.length === 0;

  useEffect(() => {
    const sortedConversations = sortAndComputePreview(
      conversations,
      userAddress,
      deletedTopics
    );
    setSortedConversations(sortedConversations);
  }, [userAddress, conversations, lastUpdateAt, deletedTopics]);

  useEffect(() => {
    const listItems = getConversationListItemsToDisplay(
      ephemeralAccount,
      searchQuery,
      sortedConversations,
      profiles
    );
    setFlatListItems(listItems);
  }, [ephemeralAccount, searchQuery, sortedConversations, profiles]);

  // Search bar hook
  useHeaderSearchBar({
    navigation,
    route,
    searchBarRef,
  });

  const keyExtractor = useCallback((item: FlatListItem) => {
    return item.topic;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FlatListItem }) => {
      if (item.topic === "welcome") {
        return <Welcome ctaOnly navigation={navigation} route={route} />;
      } else if (item.topic === "noresult") {
        return <NoResult navigation={navigation} />;
      } else if (item.topic === "ephemeral") {
        return <EphemeralAccountBanner />;
      }
      const conversation = item as ConversationWithLastMessagePreview;
      const lastMessagePreview = conversation.lastMessagePreview;
      return (
        <ConversationListItem
          navigation={navigation}
          conversation={conversation}
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
            blockedPeers[conversation.peerAddress.toLowerCase()]
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
        />
      );
    },
    [
      colorScheme,
      navigation,
      route,
      userAddress,
      blockedPeers,
      initialLoadDoneOnce,
    ]
  );

  const SearchTitleHeader = () => {
    const styles = useStyles();
    return (
      <View style={styles.searchTitleContainer}>
        <Text style={styles.searchTitle}>Chats</Text>
      </View>
    );
  };

  let ListHeaderComponent;
  if (Platform.OS === "ios") {
    ListHeaderComponent =
      searchBarFocused && !showNoResult ? <SearchTitleHeader /> : null;
  } else {
    ListHeaderComponent = searchBarFocused ? <SearchTitleHeader /> : null;
  }

  let screenToShow: JSX.Element = (
    <View style={styles.container}>
      <View style={styles.conversationList}>
        <FlashList
          keyboardShouldPersistTaps="handled"
          onMomentumScrollBegin={() => {
            converseEventEmitter.emit("conversationList-scroll");
            searchBarRef.current?.blur();
          }}
          onScrollBeginDrag={() => {
            converseEventEmitter.emit("conversationList-scroll");
            searchBarRef.current?.blur();
          }}
          contentInsetAdjustmentBehavior="automatic"
          data={flatListItems}
          extraData={[
            colorScheme,
            navigation,
            route,
            userAddress,
            blockedPeers,
            initialLoadDoneOnce,
            lastUpdateAt,
          ]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={Platform.OS === "ios" ? 77 : 88}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={
            showNoResult ? <NoResult navigation={navigation} /> : null
          }
        />
      </View>
    </View>
  );

  if (showInitialLoad) {
    screenToShow = (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical={false}
        style={styles.scrollViewWrapper}
      >
        <InitialLoad />
      </ScrollView>
    );
  } else if (showWelcome) {
    screenToShow = (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical={false}
        style={styles.scrollViewWrapper}
      >
        <Welcome ctaOnly={false} navigation={navigation} route={route} />
      </ScrollView>
    );
  }

  return (
    <>
      {screenToShow}
      <Recommendations navigation={navigation} visibility="HIDDEN" />
      {Platform.OS === "android" && (
        <NewConversationButton navigation={navigation} route={route} />
      )}
    </>
  );
}

export default gestureHandlerRootHOC(ConversationList);

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    conversationList: {
      flex: 2,
    },
    searchTitleContainer: {
      ...Platform.select({
        default: {
          padding: 10,
          paddingLeft: 16,
          backgroundColor: backgroundColor(colorScheme),
          borderBottomColor: itemSeparatorColor(colorScheme),
          borderBottomWidth: 0.5,
        },
        android: {
          padding: 10,
          paddingLeft: 16,
          borderBottomWidth: 0,
        },
      }),
    },
    searchTitle: {
      ...Platform.select({
        default: {
          fontSize: 22,
          fontWeight: "bold",
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 11,
          textTransform: "uppercase",
          fontWeight: "bold",
          color: textPrimaryColor(colorScheme),
        },
      }),
    },
    scrollViewWrapper: {
      backgroundColor: backgroundColor(colorScheme),
    },
  });
};
