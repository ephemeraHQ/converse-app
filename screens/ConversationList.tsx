import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, useColorScheme, Text, View } from "react-native";
import { SearchBarCommands } from "react-native-screens";

import { useShouldShowConnectingOrSyncing } from "../components/Connecting";
import NewConversationButton from "../components/ConversationList/NewConversationButton";
import { useHeaderSearchBar } from "../components/ConversationList/headerHook";
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
import { pick } from "../utils/objects";
import { conversationName } from "../utils/str";
import { NavigationParamList } from "./Main";

type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

export default function ConversationList({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Chats">) {
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const {
    initialLoadDoneOnce,
    conversations,
    lastUpdateAt,
    searchQuery,
    searchBarFocused,
  } = useChatStore((s) =>
    pick(s, [
      "initialLoadDoneOnce",
      "conversations",
      "lastUpdateAt",
      "searchQuery",
      "searchBarFocused",
    ])
  );
  const { blockedPeers, ephemeralAccount } = useSettingsStore((s) =>
    pick(s, ["blockedPeers", "ephemeralAccount"])
  );
  const userAddress = useUserStore((s) => s.userAddress);
  const profiles = useProfilesStore((state) => state.profiles);
  const [flatListItems, setFlatListItems] = useState<FlatListItem[]>([]);
  const searchBarRef = React.useRef<SearchBarCommands>(null);
  const [sortedConversations, setSortedConversations] = useState<
    ConversationWithLastMessagePreview[]
  >([]);

  const SearchTitleHeader = () => {
    const styles = useStyles();
    return (
      <View style={styles.searchTitleContainer}>
        <Text style={styles.searchTitle}>Chats</Text>
      </View>
    );
  };

  // Display logic
  const showInitialLoad = !initialLoadDoneOnce && flatListItems.length <= 1;
  const showWelcome =
    !searchQuery &&
    !searchBarFocused &&
    !shouldShowConnectingOrSyncing &&
    (flatListItems.length === 1 ||
      (flatListItems.length === 2 && ephemeralAccount));
  const showNoResult = flatListItems.length === 0 && searchQuery;

  useEffect(() => {
    const sortedConversations = sortAndComputePreview(
      conversations,
      userAddress
    );
    setSortedConversations(sortedConversations);
  }, [userAddress, conversations, lastUpdateAt]);

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
    userAddress,
    showWelcome,
    flatListItems,
    searchBarRef,
  });

  const keyExtractor = useCallback((item: FlatListItem) => {
    return item.topic;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FlatListItem }) => {
      if (item.topic === "welcome") {
        console.log("→ welcome");
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

  let screenToShow: JSX.Element = (
    <View style={styles.container}>
      <View style={styles.conversationList}>
        <FlashList
          keyboardShouldPersistTaps="handled"
          onMomentumScrollBegin={() => searchBarRef.current?.blur()}
          onScrollBeginDrag={() => searchBarRef.current?.blur()}
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
          ListHeaderComponent={
            searchBarFocused && !showNoResult ? <SearchTitleHeader /> : null
          }
          ListFooterComponent={
            showNoResult ? <NoResult navigation={navigation} /> : null
          }
        />
      </View>
    </View>
  );

  if (showInitialLoad) {
    screenToShow = <InitialLoad />;
  } else if (showWelcome) {
    screenToShow = (
      <Welcome ctaOnly={false} navigation={navigation} route={route} />
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

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    searchTitleContainer: {
      padding: 10,
      paddingLeft: 16,
      backgroundColor: backgroundColor(colorScheme),
      borderBottomColor: itemSeparatorColor(colorScheme),
      borderBottomWidth: 0.5,
    },
    searchTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: textPrimaryColor(colorScheme),
    },
    conversationList: {
      flex: 2,
    },
  });
};
