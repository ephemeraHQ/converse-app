import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, TextInput, ViewStyle } from "react-native";
import { SearchBarCommands } from "react-native-screens";

import ChatNullState from "../../components/Chat/ChatNullState";
import ConversationFlashList from "../../components/ConversationFlashList";
import RequestsButton from "../../components/ConversationList/RequestsButton";
import EphemeralAccountBanner from "../../components/EphemeralAccountBanner";
import InitialLoad from "../../components/InitialLoad";
import PinnedConversations from "../../components/PinnedConversations/PinnedConversations";
import Recommendations from "../../components/Recommendations/Recommendations";
import NoResult from "../../components/Search/NoResult";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  useChatStore,
  useSettingsStore,
  useProfilesStore,
  currentAccount,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { HStack } from "../../design-system/HStack";
import { Text } from "../../design-system/Text";
import { NavigationParamList } from "../../navigation/Navigation.types";
import { useAppTheme, ThemedStyle } from "../../theme/useAppTheme";
import {
  ConversationFlatListItem,
  getFilteredConversationsWithSearch,
} from "../../utils/conversation";
import { converseEventEmitter } from "../../utils/events";
import { sortRequestsBySpamScore } from "../../utils/xmtpRN/conversations";

type IProps = NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "Blocked"
> & {
  searchBarRef:
    | React.MutableRefObject<SearchBarCommands | null>
    | React.MutableRefObject<TextInput | null>;
};

type IListHeaderProps = {
  showSearchTitleHeader: boolean;
  sharingMode: boolean;
  ephemeralAccount: boolean;
  showNoResult: boolean;
};

const ListHeader = memo(function ListHeader(props: IListHeaderProps) {
  const { themed } = useAppTheme();
  const { showSearchTitleHeader, sharingMode, ephemeralAccount, showNoResult } =
    props;

  const { sortedConversationsWithPreview, pinnedConversations } = useChatStore(
    useSelect(["sortedConversationsWithPreview", "pinnedConversations"])
  );

  const hasRequests =
    sortedConversationsWithPreview.conversationsRequests.length > 0;

  const requestsCount = useMemo(() => {
    const { likelyNotSpam } = sortRequestsBySpamScore(
      sortedConversationsWithPreview.conversationsRequests
    );
    return likelyNotSpam.length;
  }, [sortedConversationsWithPreview.conversationsRequests]);

  return (
    <>
      <PinnedConversations convos={pinnedConversations} />
      {showSearchTitleHeader && (
        <HStack style={themed($searchTitleContainer)}>
          <Text>Messages</Text>
        </HStack>
      )}
      {!showSearchTitleHeader && hasRequests && !sharingMode && (
        <HStack style={themed($headerTitleContainer)}>
          <Text>Messages</Text>
          <RequestsButton requestsCount={requestsCount} />
        </HStack>
      )}
      {!showSearchTitleHeader && !hasRequests && !sharingMode && (
        <HStack style={themed($headerTitleContainer)}>
          <Text>Messages</Text>
        </HStack>
      )}
      {ephemeralAccount &&
        !showNoResult &&
        !showSearchTitleHeader &&
        !sharingMode && <EphemeralAccountBanner />}
    </>
  );
});

type IListFooterProps = {
  showInitialLoad: boolean;
  showNoResult: boolean;
};

const ListFooter = memo(function ListFooter(props: IListFooterProps) {
  const { showInitialLoad, showNoResult } = props;

  if (showInitialLoad) {
    return <InitialLoad />;
  }

  if (showNoResult) {
    return <NoResult />;
  }

  return null;
});

export const ConversationList = memo(function ConversationList(props: IProps) {
  const { navigation, route, searchBarRef } = props;

  /**
   * Store
   */
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
    useSelect(["ephemeralAccount"])
  );

  const profiles = useProfilesStore((state) => state.profiles);
  const conversationsCount = useChatStore(
    (state) => Object.keys(state.conversations).length
  );

  /**
   * State
   */
  const [flatListItems, setFlatListItems] = useState<
    ConversationFlatListItem[]
  >([]);

  /**
   * Computed
   */
  const showInitialLoading = useMemo(
    () => !initialLoadDoneOnce && flatListItems.length <= 1,
    [initialLoadDoneOnce, flatListItems.length]
  );

  const showNoResult = useMemo(
    () => flatListItems.length === 0 && !!searchQuery,
    [flatListItems.length, searchQuery]
  );

  const sharingMode = !!route.params?.frameURL;

  const showChatNullState = useMemo(
    () => conversationsCount === 0 && !searchQuery && initialLoadDoneOnce,
    [conversationsCount, searchQuery, initialLoadDoneOnce]
  );

  const showSearchTitleHeader = useMemo(
    () =>
      ((Platform.OS === "ios" && searchBarFocused && !showNoResult) ||
        (Platform.OS === "android" && searchBarFocused)) &&
      !sharingMode &&
      !showChatNullState,
    [searchBarFocused, showNoResult, sharingMode, showChatNullState]
  );

  /**
   * Handlers
   */
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

  const handleScroll = useCallback(() => {
    converseEventEmitter.emit("conversationList-scroll");
    searchBarRef.current?.blur();
  }, [searchBarRef]);

  /**
   * Effects
   */
  useEffect(() => {
    if (!initialLoadDoneOnce) {
      refreshProfileForAddress(currentAccount(), currentAccount());
    }
  }, [initialLoadDoneOnce]);

  useEffect(() => {
    const listItems = getFilteredConversationsWithSearch(
      searchQuery,
      sortedConversationsWithPreview.conversationsInbox,
      profiles
    );
    setFlatListItems(listItems);
  }, [
    searchQuery,
    sortedConversationsWithPreview.conversationsInbox,
    profiles,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", leavingScreen);
    return unsubscribe;
  }, [navigation, leavingScreen]);

  useEffect(() => {
    if (openedConversationTopic) {
      clearSearch();
    }
  }, [openedConversationTopic, clearSearch]);

  if (showChatNullState) {
    return (
      <ChatNullState
        currentAccount={currentAccount()}
        navigation={navigation}
        route={route}
      />
    );
  }

  return (
    <>
      <ConversationFlashList
        route={route}
        // @ts-ignore
        navigation={navigation}
        onScroll={handleScroll}
        items={showInitialLoading ? [] : flatListItems}
        ListHeaderComponent={
          <ListHeader
            showSearchTitleHeader={showSearchTitleHeader}
            sharingMode={sharingMode}
            ephemeralAccount={ephemeralAccount}
            showNoResult={showNoResult}
          />
        }
        ListFooterComponent={
          <ListFooter
            showInitialLoad={showInitialLoading}
            showNoResult={showNoResult}
          />
        }
      />
      <Recommendations visibility="HIDDEN" />
    </>
  );
});

const $searchTitleContainer: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
}) => ({
  padding: spacing.sm,
  paddingLeft: spacing.md,
  backgroundColor: colors.background.surface,
  borderBottomColor: colors.border.subtle,
  borderBottomWidth: Platform.OS === "ios" ? 0.5 : 0,
});

const $headerTitleContainer: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
}) => ({
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: spacing.sm,
  paddingBottom: spacing.xs,
  paddingHorizontal: spacing.md,
  backgroundColor: colors.background.surface,
  borderTopWidth: Platform.OS === "ios" ? 0.25 : 0,
  borderTopColor: colors.border.subtle,
});
