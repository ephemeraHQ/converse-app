import { RouteProp, useRoute } from "@react-navigation/native";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { SearchBarCommands } from "react-native-screens";
import { useContextSelector } from "use-context-selector";

import { refreshProfileForAddress } from "../../../data/helpers/profiles/profilesUpdate";
import {
  currentAccount,
  useChatStore,
  useProfilesStore,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import {
  ConversationsListItems,
  XmtpConversation,
} from "../../../data/store/chatStore";
import { useSelect } from "../../../data/store/storeHelpers";
import { NavigationParamList } from "../../../navigation/Navigation.types";
import { useRouter } from "../../../navigation/useNavigation";
import {
  ConversationFlatListItem,
  getFilteredConversationsWithSearch,
} from "../../../utils/conversation";
import { converseEventEmitter } from "../../../utils/events";

type IConversationListContextType = {
  searchBarRef: React.MutableRefObject<SearchBarCommands | undefined>;
  showInitialLoading: boolean;
  showNoResult: boolean;
  sharingMode: boolean;
  showChatNullState: boolean;
  showSearchTitleHeader: boolean;
  ephemeralAccount: boolean;
  setSearchQuery: (query: string) => void;
  setSearchBarFocused: (focused: boolean) => void;
  sortedConversationsWithPreview: ConversationsListItems;
  pinnedConversations: XmtpConversation[];
  flatListItems: {
    items: ConversationFlatListItem[];
    searchQuery: string;
  };
  handleScroll: () => void;
};

type IConversationListContextProps = {
  children: React.ReactNode;
};

export const ConversationListContext =
  createContext<IConversationListContextType>(
    {} as IConversationListContextType
  );

export const ConversationListContextProvider = (
  props: IConversationListContextProps
) => {
  const { children } = props;

  const navigation = useRouter();
  const route = useRoute<RouteProp<NavigationParamList, "Chats">>();

  const searchBarRef = useRef<SearchBarCommands>();

  const {
    conversations,
    searchQuery,
    searchBarFocused,
    setSearchBarFocused,
    initialLoadDoneOnce,
    openedConversationTopic,
    sortedConversationsWithPreview,
    pinnedConversations,
    setSearchQuery,
  } = useChatStore(
    useSelect([
      "conversations",
      "initialLoadDoneOnce",
      "searchQuery",
      "setSearchQuery",
      "searchBarFocused",
      "setSearchBarFocused",
      "sortedConversationsWithPreview",
      "pinnedConversations",
      "openedConversationTopic",
    ])
  );

  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

  const [flatListItems, setFlatListItems] = useState<{
    items: ConversationFlatListItem[];
    searchQuery: string;
  }>({ items: [], searchQuery: "" });

  const profiles = useProfilesStore((state) => state.profiles);

  /**
   * Computed
   */
  const showInitialLoading = useMemo(
    () => !initialLoadDoneOnce && flatListItems.items.length <= 1,
    [initialLoadDoneOnce, flatListItems.items.length]
  );

  const showNoResult = useMemo(
    () => flatListItems.items.length === 0 && !!searchQuery,
    [flatListItems.items.length, searchQuery]
  );

  // @ts-ignore
  const sharingMode = !!route.params?.frameURL;

  const showChatNullState = useMemo(
    () =>
      Object.keys(conversations).length === 0 &&
      !searchQuery &&
      initialLoadDoneOnce,
    [conversations, searchQuery, initialLoadDoneOnce]
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
    searchBarRef.current?.clearText?.();
    searchBarRef.current?.blur?.();
    setSearchBarFocused(false);
  }, [setSearchBarFocused, setSearchQuery]);

  const handleScroll = useCallback(() => {
    converseEventEmitter.emit("conversationList-scroll");
    searchBarRef.current?.blur();
  }, []);

  /**
   * Effects
   */

  // Fetch list items
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

  const value = useMemo(
    () => ({
      showInitialLoading,
      showNoResult,
      sharingMode,
      showChatNullState,
      showSearchTitleHeader,
      ephemeralAccount,
      flatListItems,
      handleScroll,
      searchBarRef,
      setSearchQuery,
      setSearchBarFocused,
      sortedConversationsWithPreview,
      pinnedConversations,
    }),
    [
      showInitialLoading,
      showNoResult,
      sharingMode,
      showChatNullState,
      showSearchTitleHeader,
      ephemeralAccount,
      flatListItems,
      handleScroll,
      searchBarRef,
      setSearchQuery,
      setSearchBarFocused,
      sortedConversationsWithPreview,
      pinnedConversations,
    ]
  );

  return (
    <ConversationListContext.Provider value={value}>
      {children}
    </ConversationListContext.Provider>
  );
};

export function useConversationListContext<
  K extends IConversationListContextType[keyof IConversationListContextType],
>(select: (state: IConversationListContextType) => K) {
  return useContextSelector(ConversationListContext, select);
}

export function useConversationListContextMultiple<
  T extends Partial<IConversationListContextType>,
>(select: (state: IConversationListContextType) => T): T {
  return useContextSelector(ConversationListContext, select);
}
