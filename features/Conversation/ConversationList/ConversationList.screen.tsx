import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Platform, TextInput, ViewStyle } from "react-native";
import { SearchBarCommands } from "react-native-screens";

import { useShowChatNullState } from "./ConversationList.utils";
import { useConversationListHeader } from "./ConversationListHeader";
import ChatNullState from "../../../components/Chat/ChatNullState";
import ConversationFlashList from "../../../components/ConversationFlashList";
import RequestsButton from "../../../components/ConversationList/RequestsButton";
import EphemeralAccountBanner from "../../../components/EphemeralAccountBanner";
import InitialLoad from "../../../components/InitialLoad";
import PinnedConversations from "../../../components/PinnedConversations/PinnedConversations";
import Recommendations from "../../../components/Recommendations/Recommendations";
import NoResult from "../../../components/Search/NoResult";
import { refreshProfileForAddress } from "../../../data/helpers/profiles/profilesUpdate";
import {
  currentAccount,
  useChatStore,
  useProfilesStore,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { useSelect } from "../../../data/store/storeHelpers";
import { HStack } from "../../../design-system/HStack";
import { Text } from "../../../design-system/Text";
import { NavigationParamList } from "../../../screens/Navigation/Navigation";
import { ThemedStyle, useAppTheme } from "../../../theme/useAppTheme";
import { getFilteredConversationsWithSearch } from "../../../utils/conversation";
import { converseEventEmitter } from "../../../utils/events";
import { sortRequestsBySpamScore } from "../../../utils/xmtpRN/conversations";

type IConversationListScreenProps = NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "Blocked"
> & {
  searchBarRef:
    | React.MutableRefObject<SearchBarCommands | null>
    | React.MutableRefObject<TextInput | null>;
};

export const ConversationListScreen = memo(function ConversationListScreen(
  props: IConversationListScreenProps
) {
  const { navigation, route, searchBarRef } = props;

  useConversationListHeader();

  /**
   * Store
   */
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

  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

  const { data: flatListItems = [] } = useFlatListItems();

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

  const showChatNullState = useShowChatNullState();

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

  // Reset on leave
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      if (sharingMode) {
        clearSearch();
      }
    });
    return unsubscribe;
  }, [navigation, sharingMode, clearSearch]);

  // Reset on open conversation
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

function useFlatListItems() {
  const profiles = useProfilesStore((state) => state.profiles);
  const { searchQuery, sortedConversationsWithPreview } = useChatStore(
    useSelect(["searchQuery", "sortedConversationsWithPreview"])
  );

  return useQuery({
    queryKey: ["conversationListItems", searchQuery, ...Object.keys(profiles)],
    queryFn: () =>
      getFilteredConversationsWithSearch(
        searchQuery,
        sortedConversationsWithPreview.conversationsInbox,
        profiles
      ),
  });
}

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
