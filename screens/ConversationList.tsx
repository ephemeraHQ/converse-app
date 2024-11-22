import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  itemSeparatorColor,
  listItemSeparatorColor,
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

import ChatNullState from "../components/Chat/ChatNullState";
import ConversationFlashList from "../components/ConversationFlashList";
import NewConversationButton from "../components/ConversationList/NewConversationButton";
import RequestsButton from "../components/ConversationList/RequestsButton";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import { useHeaderSearchBar } from "./Navigation/ConversationListNav";
import { NavigationParamList } from "./Navigation/Navigation";
import { PinnedConversations } from "../components/PinnedConversations/PinnedConversations";
import Recommendations from "../components/Recommendations/Recommendations";
import NoResult from "../components/Search/NoResult";
// import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { useSelect } from "../data/store/storeHelpers";
import { ConversationFlatListItem } from "../utils/conversation";
import { converseEventEmitter } from "../utils/events";
import { useIsSharingMode } from "../features/conversation-list/useIsSharingMode";
import { useConversationListRequestCount } from "../features/conversation-list/useConversationListRequestCount";
import { useConversationListItems } from "../features/conversation-list/useConversationListItems";
import { ConversationWithCodecsType } from "@utils/xmtpRN/client";

type Props = {
  searchBarRef:
    | React.MutableRefObject<SearchBarCommands | null>
    | React.MutableRefObject<TextInput | null>;
} & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "Blocked"
>;

type FlatListItemType = ConversationFlatListItem | ConversationWithCodecsType;

function ConversationList({ navigation, route, searchBarRef }: Props) {
  const styles = useStyles();
  const {
    searchQuery,
    searchBarFocused,
    setSearchBarFocused,
    initialLoadDoneOnce,
    openedConversationTopic,
    setSearchQuery,
  } = useChatStore(
    useSelect([
      "initialLoadDoneOnce",
      "searchQuery",
      "setSearchQuery",
      "searchBarFocused",
      "setSearchBarFocused",
      "openedConversationTopic",
    ])
  );
  const sharingMode = useIsSharingMode();

  const { ephemeralAccount } = useSettingsStore(
    useSelect(["peersStatus", "ephemeralAccount"])
  );
  const profiles = useProfilesStore((s) => s.profiles);
  const pinnedConversations = useChatStore((s) => s.pinnedConversationTopics);
  const currentAccount = useCurrentAccount();
  const {
    data: items,
    isLoading: showInitialLoad,
    refetch,
  } = useConversationListItems();

  const [flatListItems, setFlatListItems] = useState<{
    items: FlatListItemType[];
    searchQuery: string;
  }>({ items: [], searchQuery: "" });

  // Display logic
  const showNoResult = flatListItems.items.length === 0 && !!searchQuery;

  const requestsCount = useConversationListRequestCount();

  const showChatNullState =
    items?.length === 0 && !searchQuery && !showInitialLoad;

  useEffect(() => {
    if (!initialLoadDoneOnce) {
      // First login, let's refresh the profile
      // refreshProfileForAddress(currentAccount!, currentAccount!);
    }
  }, [initialLoadDoneOnce, currentAccount]);

  useEffect(() => {
    // TODO:
    setFlatListItems({ items: items ?? [], searchQuery });
  }, [searchQuery, profiles, items]);

  // Search bar hook
  useHeaderSearchBar({
    navigation,
    route,
    searchBarRef,
    autoHide: !sharingMode,
    showSearchBar: !showChatNullState,
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
    if (openedConversationTopic) {
      clearSearch();
    }
  }, [clearSearch, openedConversationTopic]);

  const ListHeaderComponents: React.ReactElement[] = [
    <PinnedConversations
      topics={pinnedConversations}
      key="pinnedConversations"
    />,
  ];

  const showSearchTitleHeader =
    ((Platform.OS === "ios" && searchBarFocused && !showNoResult) ||
      (Platform.OS === "android" && searchBarFocused)) &&
    !sharingMode &&
    !showChatNullState;

  if (showSearchTitleHeader) {
    ListHeaderComponents.push(
      <View key="search" style={styles.searchTitleContainer}>
        <Text style={styles.searchTitle}>Messages</Text>
      </View>
    );
  } else if (requestsCount > 0 && !sharingMode) {
    ListHeaderComponents.push(
      <View key="search" style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Messages</Text>
        <RequestsButton key="requests" requestsCount={requestsCount} />
      </View>
    );
  } else if (!sharingMode) {
    ListHeaderComponents.push(
      <View key="search" style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
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
    ListFooterComponent = <NoResult />;
  }

  if (showChatNullState) {
    return (
      <ChatNullState
        currentAccount={currentAccount!}
        navigation={navigation}
        route={route}
      />
    );
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
        refetch={refetch}
      />
      <Recommendations visibility="HIDDEN" />
      {Platform.OS === "android" && !sharingMode && <NewConversationButton />}
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
          fontSize: 16,
        },
      }),
    },
    headerTitleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      paddingBottom: 8,
      paddingHorizontal: 16,
      ...Platform.select({
        default: {
          backgroundColor: backgroundColor(colorScheme),
          borderTopWidth: 0.25,
          borderTopColor: listItemSeparatorColor(colorScheme),
        },
        android: {
          borderBottomWidth: 0,
        },
      }),
    },
    headerTitle: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 3,
          marginRight: 110,
        },
        android: {
          fontSize: 16,
        },
      }),
    },
    scrollViewWrapper: {
      backgroundColor: backgroundColor(colorScheme),
    },
  });
};
