import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableHighlight,
} from "react-native";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { SearchBarCommands } from "react-native-screens";

import ConversationFlashList from "../components/ConversationFlashList";
import NewConversationButton from "../components/ConversationList/NewConversationButton";
import InitialLoad from "../components/InitialLoad";
import Recommendations from "../components/Recommendations/Recommendations";
import Welcome from "../components/Welcome";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import {
  useChatStore,
  useSettingsStore,
  useUserStore,
  useProfilesStore,
  currentAccount,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import {
  textPrimaryColor,
  backgroundColor,
  itemSeparatorColor,
  listItemSeparatorColor,
  clickedItemBackgroundColor,
} from "../utils/colors";
import {
  LastMessagePreview,
  sortAndComputePreview,
  getConversationListItemsToDisplay,
} from "../utils/conversation";
import { converseEventEmitter } from "../utils/events";
import { pick } from "../utils/objects";
import { useHeaderSearchBar } from "./Navigation/ConversationListNav";
import { NavigationParamList } from "./Navigation/Navigation";

type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

type Props = {
  searchBarRef:
    | React.MutableRefObject<SearchBarCommands | null>
    | React.MutableRefObject<TextInput | null>;
} & NativeStackScreenProps<NavigationParamList, "Chats">;

function ConversationList({ navigation, route, searchBarRef }: Props) {
  const styles = useStyles();
  const {
    conversations,
    lastUpdateAt,
    searchQuery,
    searchBarFocused,
    deletedTopics,
    initialLoadDoneOnce,
    sortedConversationsWithPreview,
  } = useChatStore((s) =>
    pick(s, [
      "initialLoadDoneOnce",
      "conversations",
      "lastUpdateAt",
      "searchQuery",
      "searchBarFocused",
      "deletedTopics",
      "sortedConversationsWithPreview",
    ])
  );
  const { ephemeralAccount } = useSettingsStore((s) =>
    pick(s, ["ephemeralAccount"])
  );
  const colorScheme = useColorScheme();
  const userAddress = useUserStore((s) => s.userAddress);
  const profiles = useProfilesStore((state) => state.profiles);
  const [flatListItems, setFlatListItems] = useState<FlatListItem[]>([]);

  // Display logic
  const showInitialLoad = !initialLoadDoneOnce && flatListItems.length <= 1;
  const showNoResult = flatListItems.length === 0 && !!searchQuery;

  // Welcome screen
  const showWelcome =
    !searchQuery &&
    !searchBarFocused &&
    sortedConversationsWithPreview.conversationsInbox.length === 0;

  useEffect(() => {
    sortAndComputePreview(conversations, userAddress, deletedTopics);
  }, [userAddress, conversations, lastUpdateAt, deletedTopics]);

  useEffect(() => {
    if (!initialLoadDoneOnce) {
      // First login, let's refresh the profile
      refreshProfileForAddress(currentAccount(), currentAccount());
    }
  }, [initialLoadDoneOnce]);

  useEffect(() => {
    const listItems = getConversationListItemsToDisplay(
      ephemeralAccount,
      searchQuery,
      sortedConversationsWithPreview.conversationsInbox,
      profiles
    );
    setFlatListItems(listItems);
  }, [
    ephemeralAccount,
    searchQuery,
    sortedConversationsWithPreview.conversationsInbox,
    profiles,
  ]);

  // Search bar hook
  useHeaderSearchBar({
    navigation,
    route,
    searchBarRef,
  });

  let ListHeaderComponent: React.ReactElement | undefined = undefined;
  const showSearchTitleHeader =
    (Platform.OS === "ios" && searchBarFocused && !showNoResult) ||
    (Platform.OS === "android" && searchBarFocused);
  if (showSearchTitleHeader) {
    ListHeaderComponent = (
      <View style={styles.searchTitleContainer}>
        <Text style={styles.searchTitle}>Chats</Text>
      </View>
    );
  } else if (sortedConversationsWithPreview.conversationsRequests.length > 0) {
    ListHeaderComponent = (
      <TouchableHighlight
        underlayColor={clickedItemBackgroundColor(colorScheme)}
        onPress={() => {
          navigation.push("ChatsRequests");
        }}
      >
        <View style={styles.requestsHeader}>
          <Text style={styles.requestsHeaderTitle}>Requests</Text>
        </View>
      </TouchableHighlight>
    );
  }

  let screenToShow = (
    <ConversationFlashList
      route={route}
      navigation={navigation}
      onScroll={() => {
        converseEventEmitter.emit("conversationList-scroll");
        searchBarRef.current?.blur();
      }}
      showNoResult={showNoResult}
      items={flatListItems}
      ListHeaderComponent={ListHeaderComponent}
    />
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
    requestsHeader: Platform.select({
      default: {
        paddingVertical: 8,
        paddingRight: 60,
        marginLeft: 32,
        borderBottomWidth: 0.25,
        borderBottomColor: listItemSeparatorColor(colorScheme),
      },
      android: {
        paddingTop: 12,
        paddingHorizontal: 16,
      },
    }),
    requestsHeaderTitle: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          fontWeight: "600",
          marginBottom: 3,
          marginRight: 110,
        },
        android: {
          fontSize: 16,
        },
      }),
    },
  });
};
