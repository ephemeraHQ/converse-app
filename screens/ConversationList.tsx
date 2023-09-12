import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  Keyboard,
  Animated,
} from "react-native";

import Connecting, {
  useShouldShowConnectingOrSyncing,
} from "../components/Connecting";
import NewConversationButton from "../components/ConversationList/NewConversationButton";
import ShareProfileButton from "../components/ConversationList/ShareProfileButton";
import ConversationListItem from "../components/ConversationListItem";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import Recommendations from "../components/Recommendations/Recommendations";
import NoResult from "../components/Search/NoResult";
import SettingsButton from "../components/SettingsButton";
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
  conversationLastMessagePreview,
} from "../utils/conversation";
import { pick } from "../utils/objects";
import { getMatchedPeerAddresses } from "../utils/search";
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
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { initialLoadDoneOnce, conversations, lastUpdateAt } = useChatStore(
    (s) => pick(s, ["initialLoadDoneOnce", "conversations", "lastUpdateAt"])
  );
  const userAddress = useUserStore((s) => s.userAddress);
  const { blockedPeers, ephemeralAccount } = useSettingsStore((s) =>
    pick(s, ["blockedPeers", "ephemeralAccount"])
  );

  const profiles = useProfilesStore((state) => state.profiles);
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const [flatListItems, setFlatListItems] = useState<FlatListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedConversations, setSortedConversations] =
    useState<ConversationWithLastMessagePreview[]>();
  const [searchBarFocused, setSearchBarFocused] = useState(false);

  useEffect(() => {
    const conversationWithPreview = Object.values(conversations)
      .filter((a) => a?.peerAddress && (!a.pending || a.messages.size > 0))
      .map((c: ConversationWithLastMessagePreview) => {
        c.lastMessagePreview = conversationLastMessagePreview(c, userAddress);
        return c;
      });

    conversationWithPreview.sort((a, b) => {
      const aDate = a.lastMessagePreview
        ? a.lastMessagePreview.message.sent
        : a.createdAt;
      const bDate = b.lastMessagePreview
        ? b.lastMessagePreview.message.sent
        : b.createdAt;
      return bDate - aDate;
    });

    setSortedConversations(conversationWithPreview);
  }, [userAddress, conversations, lastUpdateAt]);

  useEffect(() => {
    const items = ephemeralAccount ? [{ topic: "ephemeral" }] : [];
    if (searchQuery && sortedConversations) {
      const matchedPeerAddresses = getMatchedPeerAddresses(
        profiles,
        searchQuery
      );
      const filteredConversations = sortedConversations.filter((conversation) =>
        matchedPeerAddresses.includes(conversation.peerAddress)
      );
      setFlatListItems([...(filteredConversations || [])]);
    } else {
      setFlatListItems([
        ...items,
        ...(sortedConversations || []),
        { topic: "welcome" },
      ]);
    }
  }, [ephemeralAccount, searchQuery, sortedConversations, profiles]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        userAddress ? (
          <SettingsButton route={route} navigation={navigation} />
        ) : null,
      headerRight: () => (
        <>
          <ShareProfileButton navigation={navigation} route={route} />
          {Platform.OS === "ios" && (
            <NewConversationButton navigation={navigation} route={route} />
          )}
        </>
      ),
    });
  }, [navigation, route, userAddress, profiles]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        if (shouldShowConnectingOrSyncing) {
          return <Connecting />;
        } else {
          return Platform.OS === "android" ? (
            <Text style={styles.androidTitle}>Converse</Text>
          ) : undefined;
        }
      },
    });
  }, [navigation, shouldShowConnectingOrSyncing, styles.androidTitle]);

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

  const [headerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (searchBarFocused) {
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [searchBarFocused, headerAnim]);

  const SearchTitleHeader = () => {
    const styles = useStyles();
    return (
      <Animated.View
        style={[{ opacity: headerAnim }, styles.searchTitleContainer]}
      >
        <Text style={styles.searchTitle}>Chats</Text>
      </Animated.View>
    );
  };

  const showInitialLoad = !initialLoadDoneOnce && flatListItems.length <= 1;
  const showWelcome =
    !searchQuery &&
    !searchBarFocused &&
    (flatListItems.length === 1 ||
      (flatListItems.length === 2 && ephemeralAccount));
  const showNoResult = flatListItems.length === 0 && searchQuery;

  useLayoutEffect(() => {
    if (
      initialLoadDoneOnce &&
      showWelcome === false &&
      flatListItems.length > 1
    ) {
      navigation.setOptions({
        headerSearchBarOptions: {
          hideNavigationBar: true,
          hideWhenScrolling: false,
          autoFocus: false,
          placeholder: "Search",
          onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
          onFocus: () => setSearchBarFocused(true),
          onCancelButtonPress: () => setSearchBarFocused(false),
        },
      });
    }
  }, [navigation, showWelcome, initialLoadDoneOnce, flatListItems]);

  let screenToShow: JSX.Element = (
    <View style={styles.container}>
      <View style={styles.conversationList}>
        <FlashList
          keyboardShouldPersistTaps="handled"
          onMomentumScrollBegin={Keyboard.dismiss}
          onScrollBeginDrag={Keyboard.dismiss}
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
          ListHeaderComponent={searchBarFocused ? <SearchTitleHeader /> : null}
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
  } else if (showNoResult) {
    screenToShow = (
      <View style={styles.container}>
        <View style={styles.conversationList}>
          <NoResult navigation={navigation} />
        </View>
      </View>
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
    androidTitle: {
      color: textPrimaryColor(colorScheme),
      fontSize: 22,
      lineHeight: 26,
    },
  });
};
