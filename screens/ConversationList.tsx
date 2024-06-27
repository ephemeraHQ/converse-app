import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  itemSeparatorColor,
  textPrimaryColor,
} from "@styles/colors";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { SearchBarCommands } from "react-native-screens";

import ConversationFlashList from "../components/ConversationFlashList";
import NewConversationButton from "../components/ConversationList/NewConversationButton";
import RequestsButton from "../components/ConversationList/RequestsButton";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import PinnedConversations from "../components/PinnedConversations/PinnedConversations";
import Recommendations from "../components/Recommendations/Recommendations";
import NoResult from "../components/Search/NoResult";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import {
  currentAccount,
  useChatStore,
  useProfilesStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { useSelect } from "../data/store/storeHelpers";
import {
  LastMessagePreview,
  getFilteredConversationsWithSearch,
} from "../utils/conversation";
import { converseEventEmitter } from "../utils/events";
import { sortRequestsBySpamScore } from "../utils/xmtpRN/conversations";
import { useHeaderSearchBar } from "./Navigation/ConversationListNav";
import { NavigationParamList } from "./Navigation/Navigation";
import { useIsSplitScreen } from "./Navigation/navHelpers";

type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

type Props = {
  searchBarRef:
    | React.MutableRefObject<SearchBarCommands | null>
    | React.MutableRefObject<TextInput | null>;
} & NativeStackScreenProps<NavigationParamList, "Chats" | "ShareFrame">;

function ConversationList({ navigation, route, searchBarRef }: Props) {
  const styles = useStyles();
  const {
    searchQuery,
    searchBarFocused,
    setSearchBarFocused,
    initialLoadDoneOnce,
    sortedConversationsWithPreview,
    openedConversationTopic,
    setSearchQuery,
  } = useChatStore(
    useSelect([
      "initialLoadDoneOnce",
      "searchQuery",
      "setSearchQuery",
      "searchBarFocused",
      "setSearchBarFocused",
      "sortedConversationsWithPreview",
      "openedConversationTopic",
    ])
  );

  const { ephemeralAccount } = useSettingsStore(
    useSelect(["peersStatus", "ephemeralAccount"])
  );
  const profiles = useProfilesStore((s) => s.profiles);
  const pinnedConversations = useChatStore((s) => s.pinnedConversations);

  const [flatListItems, setFlatListItems] = useState<{
    items: FlatListItem[];
    searchQuery: string;
  }>({ items: [], searchQuery: "" });

  // Display logic
  const showInitialLoad =
    !initialLoadDoneOnce && flatListItems.items.length <= 1;
  const showNoResult = flatListItems.items.length === 0 && !!searchQuery;

  const isSplit = useIsSplitScreen();
  const sharingMode = !!route.params?.frameURL;

  const { likelyNotSpam } = sortRequestsBySpamScore(
    sortedConversationsWithPreview.conversationsRequests
  );

  useEffect(() => {
    if (!initialLoadDoneOnce) {
      // First login, let's refresh the profile
      refreshProfileForAddress(currentAccount(), currentAccount());
    }
  }, [initialLoadDoneOnce]);

  useEffect(() => {
    const listItems = getFilteredConversationsWithSearch(
      searchQuery,
      sortedConversationsWithPreview.conversationsInbox,
      profiles
    );
    setFlatListItems({ items: listItems, searchQuery });
  }, [
    searchQuery,
    sortedConversationsWithPreview.conversationsInbox,
    profiles,
  ]);

  // Search bar hook
  useHeaderSearchBar({
    navigation,
    route,
    searchBarRef,
    autoHide: !sharingMode,
  });

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    (searchBarRef.current as any)?.clearText?.();
    (searchBarRef.current as any)?.blur?.();
    setSearchBarFocused(false);
  }, [searchBarRef, setSearchBarFocused, setSearchQuery]);

  const leavingScreen = useCallback(() => {
    if (sharingMode) {
      clearSearch();
    }
  }, [clearSearch, sharingMode]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", leavingScreen);
    return unsubscribe;
  }, [navigation, leavingScreen]);

  useEffect(() => {
    // In split screen, when selecting a convo with search active,
    // let's clear the search
    if (isSplit && openedConversationTopic) {
      clearSearch();
    }
  }, [clearSearch, isSplit, openedConversationTopic]);

  const ListHeaderComponents: React.ReactElement[] = [
    <PinnedConversations
      convos={pinnedConversations}
      key="pinnedConversations"
    />,
  ];
  const showSearchTitleHeader =
    ((Platform.OS === "ios" && searchBarFocused && !showNoResult) ||
      (Platform.OS === "android" && searchBarFocused)) &&
    !sharingMode;
  if (showSearchTitleHeader) {
    ListHeaderComponents.push(
      <View key="search" style={styles.searchTitleContainer}>
        <Text style={styles.searchTitle}>Chats</Text>
      </View>
    );
  } else if (
    sortedConversationsWithPreview.conversationsRequests.length > 0 &&
    !sharingMode
  ) {
    ListHeaderComponents.push(
      <RequestsButton
        key="requests"
        navigation={navigation}
        route={route}
        requestsCount={likelyNotSpam.length}
      />
    );
  }

  let ListFooterComponent: React.ReactElement | undefined = undefined;
  if (showInitialLoad) {
    ListFooterComponent = <InitialLoad />;
  } else if (
    ephemeralAccount &&
    !showNoResult &&
    !showSearchTitleHeader &&
    !sharingMode
  ) {
    ListHeaderComponents.push(<EphemeralAccountBanner key="ephemeral" />);
  }
  if (showNoResult) {
    ListFooterComponent = <NoResult navigation={navigation} />;
  }

  return (
    <>
      <ConversationFlashList
        route={route}
        navigation={navigation}
        onScroll={() => {
          converseEventEmitter.emit("conversationList-scroll");
          searchBarRef.current?.blur();
        }}
        itemsForSearchQuery={flatListItems.searchQuery}
        items={showInitialLoad ? [] : flatListItems.items}
        ListHeaderComponent={
          ListHeaderComponents.length > 0 ? (
            <>{ListHeaderComponents}</>
          ) : undefined
        }
        ListFooterComponent={ListFooterComponent}
      />
      <Recommendations navigation={navigation} visibility="HIDDEN" />
      {(Platform.OS === "android" || Platform.OS === "web") && !sharingMode && (
        <NewConversationButton navigation={navigation} route={route} />
      )}
    </>
  );
}

export default gestureHandlerRootHOC(ConversationList);

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    searchTitleContainer: Platform.select({
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
