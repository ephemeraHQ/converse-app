import { Center } from "@/design-system/Center";
import { AnimatedVStack } from "@/design-system/VStack";
import { EmptyState } from "@/design-system/empty-state";
import { Loader } from "@/design-system/loader";
import { useSearchConvosUsers } from "@/features/conversation/conversation-create/hooks/use-search-convos-users";
import { inboxIdIsPartOfConversationUsingCacheData } from "@/features/conversation/utils/inbox-id-is-part-of-converastion";
import { useConversationStoreContext } from "@/features/conversation/conversation.store-context";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/use-app-theme";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { ReactNode, memo, useMemo } from "react";
import { FlatList } from "react-native";
import {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearchExistingDms } from "../queries/search-existing-dms.query";
import { useSearchExistingGroupsByGroupMembers } from "../queries/search-existing-groups-by-group-members.query";
import { useSearchExistingGroupsByGroupName } from "../queries/search-existing-groups-by-group-name.query";
import { ConversationSearchResultsListItemGroup } from "./conversation-create-search-results-list-item-group";
import { ConversationSearchResultsListItemUser } from "./conversation-create-search-results-list-item-user";
import { ConversationSearchResultsListItemDm } from "./conversation-create-search-results-list-item-user-dm";
import { useSafeCurrentSender } from "@/features/multi-inbox/multi-inbox.store";
// Because we want a mix of DMs, groups, and profiles
const MAX_INITIAL_RESULTS = 3;

type ISearchResultItemDm = {
  type: "dm";
  conversationTopic: ConversationTopic;
};

type ISearchResultItemGroup = {
  type: "group";
  conversationTopic: ConversationTopic;
};

type ISearchResultItemProfile = {
  type: "profile";
  inboxId: InboxId;
};

type SearchResultItem =
  | ISearchResultItemDm
  | ISearchResultItemGroup
  | ISearchResultItemProfile;

function searchResultIsDm(item: SearchResultItem): item is ISearchResultItemDm {
  return item.type === "dm";
}

function searchResultIsGroup(
  item: SearchResultItem
): item is ISearchResultItemGroup {
  return item.type === "group";
}

function searchResultIsProfile(
  item: SearchResultItem
): item is ISearchResultItemProfile {
  return item.type === "profile";
}

export function ConversationSearchResultsList() {
  const insets = useSafeAreaInsets();

  const searchQuery = useConversationStoreContext(
    (state) => state.searchTextValue
  );

  const selectedSearchUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds
  );

  const currentUserInboxId = useSafeCurrentSender().inboxId;

  const { data: searchConvosUsersData, isLoading: isSearchingConvosUsers } =
    useSearchConvosUsers({
      searchQuery,
      inboxIdsToOmit: [...selectedSearchUserInboxIds, currentUserInboxId],
    });

  const { data: existingDmTopics = [], isLoading: isLoadingExistingDmTopics } =
    useSearchExistingDms({
      searchQuery,
      inboxId: currentUserInboxId,
    });

  const {
    data: existingGroupsByGroupNameTopics = [],
    isLoading: isLoadingExistingGroupsByName,
  } = useSearchExistingGroupsByGroupName({
    searchQuery,
    searcherInboxId: currentUserInboxId,
  });

  const {
    data: existingGroupsByMemberNameTopics = [],
    isLoading: isLoadingExistingGroupsByMembers,
  } = useSearchExistingGroupsByGroupMembers({
    searchQuery,
    searcherInboxId: currentUserInboxId,
  });

  const listData = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. Add DMs first
    // But if we have selected users in the search bar, don't show DMs
    // Because otherwise the user would have selected the existing DM already...
    if (selectedSearchUserInboxIds.length === 0) {
      items.push(
        ...existingDmTopics
          .map((conversationTopic) => ({
            type: "dm" as const,
            conversationTopic,
          }))
          .slice(0, MAX_INITIAL_RESULTS)
      );
    }

    // 2. Add groups where member names match the search query
    items.push(
      ...existingGroupsByMemberNameTopics
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS)
    );

    // 3. Add groups where group names match the search query
    items.push(
      ...existingGroupsByGroupNameTopics
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS)
    );

    // 4. Add user profiles that aren't already in DMs
    const profilesNotInDms = searchConvosUsersData
      ?.map((profile) => ({
        type: "profile" as const,
        inboxId: profile.xmtpId,
      }))
      .filter(({ inboxId }) => {
        const addedDms = items.filter(searchResultIsDm);
        // Skip if the profile is already in a DM conversation
        return !addedDms.some(({ conversationTopic }) => {
          return inboxIdIsPartOfConversationUsingCacheData({
            inboxId,
            conversationTopic,
          });
        });
      });

    items.push(...(profilesNotInDms ?? []));

    return items;
  }, [
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
  ]);

  const isStillLoadingSearchResults =
    isLoadingExistingDmTopics ||
    isLoadingExistingGroupsByName ||
    isLoadingExistingGroupsByMembers ||
    isSearchingConvosUsers;

  return (
    <Container>
      <FlatList
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Center
            style={{
              paddingBottom: insets.bottom,
              flex: 1,
            }}
          >
            {isStillLoadingSearchResults ? (
              <Loader size="sm" />
            ) : searchQuery ? (
              <EmptyState
                description={
                  searchConvosUsersData?.length === 0
                    ? "No results found"
                    : `Couldn't find what you are looking for`
                }
              />
            ) : null}
          </Center>
        }
        data={listData}
        renderItem={({ item }) => {
          if (searchResultIsDm(item)) {
            return (
              <ConversationSearchResultsListItemDm
                conversationTopic={item.conversationTopic}
              />
            );
          }
          if (searchResultIsGroup(item)) {
            return (
              <ConversationSearchResultsListItemGroup
                conversationTopic={item.conversationTopic}
              />
            );
          }
          if (searchResultIsProfile(item)) {
            return (
              <ConversationSearchResultsListItemUser inboxId={item.inboxId} />
            );
          }
          const _ensureNever: never = item;
          return null;
        }}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => {
          if (searchResultIsDm(item)) {
            return `dm-${item.conversationTopic}`;
          }
          if (searchResultIsGroup(item)) {
            return `group-${item.conversationTopic}`;
          }
          if (searchResultIsProfile(item)) {
            return `profile-${item.inboxId}`;
          }
          const _ensureNever: never = item;
          throw new Error("Invalid item type");
        }}
      />
    </Container>
  );
}

const Container = memo(function Container(props: { children: ReactNode }) {
  const { children } = props;

  const { theme } = useAppTheme();

  const { height } = useAnimatedKeyboard();

  const searchQuery = useConversationStoreContext(
    (state) => state.searchTextValue
  );

  const containerVisibleAV = useDerivedValue(() => {
    if (!!searchQuery) {
      return withSpring(1, {
        stiffness: theme.animation.spring.stiffness,
        damping: theme.animation.spring.damping,
      });
    }

    // Instant is better UX than animating to 0
    return 0;
  }, [searchQuery]);

  const containerAS = useAnimatedStyle(() => ({
    bottom: height.value,
    opacity: containerVisibleAV.value,
    zIndex: !!searchQuery ? 1 : 0,
  }));

  return (
    <AnimatedVStack
      // {...debugBorder()}
      style={[
        $globalStyles.absoluteFill,
        containerAS,
        {
          backgroundColor: theme.colors.background.surfaceless,
        },
      ]}
    >
      {children}
    </AnimatedVStack>
  );
});
