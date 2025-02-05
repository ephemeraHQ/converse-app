import { getCurrentAccount } from "@/data/store/accountsStore";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { EmptyState } from "@/design-system/empty-state";
import { Loader } from "@/design-system/loader";
import { getSearchByConversationMembershipQueryOptions } from "@/features/conversation/conversation-create/utils/search-conversations/search-conversations.query";
import { useSearchConvosUsers } from "@/features/conversation/conversation-create/hooks/use-search-convos-users";
import { useConversationStoreContext } from "@/features/conversation/conversation.store-context";
import { useSafeCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { getDmPeerInboxIdQueryData } from "@/queries/use-dm-peer-inbox-id-query";
import { getGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/useAppTheme";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { ReactNode, memo, useMemo } from "react";
import { FlatList } from "react-native";
import {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConversationSearchResultsListItemGroup } from "./conversation-create-search-results-list-item-group";
import { ConversationSearchResultsListItemUser } from "./conversation-create-search-results-list-item-user";
import { ConversationSearchResultsListItemDm } from "./conversation-create-search-results-list-item-user-dm";

// Because we want a mix of DMs, groups, and profiles
const MAX_INITIAL_RESULTS = 3;

type SearchResultItem =
  | {
      type: "dm" | "group";
      conversationTopic: ConversationTopic;
    }
  | {
      type: "profile";
      inboxId: InboxId;
    };

export function ConversationSearchResultsList() {
  const insets = useSafeAreaInsets();

  const searchQuery = useConversationStoreContext(
    (state) => state.searchTextValue
  );

  const selectedSearchUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds
  );

  const currentUserInboxId = useSafeCurrentAccountInboxId();

  const { data: searchConvosUsersData, isLoading: isSearchingConvosUsers } =
    useSearchConvosUsers({
      searchQuery,
      inboxIdsToOmit: [...selectedSearchUserInboxIds, currentUserInboxId],
    });

  const {
    data: existingConversationMembershipSearchResults,
    isLoading: isSearchingExistingConversations,
  } = useQuery(
    getSearchByConversationMembershipQueryOptions({
      searchQuery,
    })
  );

  const listData = useMemo(() => {
    const items: SearchResultItem[] = [];

    // Wait until we finish loading both existing and searched results
    if (
      !existingConversationMembershipSearchResults ||
      !searchConvosUsersData
    ) {
      return items;
    }

    // If we have selected users, only show profiles
    if (selectedSearchUserInboxIds.length > 0) {
      return searchConvosUsersData?.inboxIds.map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }));
    }

    const {
      existingDmTopics,
      existingGroupsByMemberNameTopics,
      existingGroupsByGroupNameTopics,
    } = existingConversationMembershipSearchResults;

    // 1. Add DMs first
    items.push(
      ...existingDmTopics
        .map((conversationTopic) => ({
          type: "dm" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS)
    );

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
    // Filter out any groups that were already added due to member name matches
    const uniqueGroupNameMatches = existingGroupsByGroupNameTopics.filter(
      (topic) =>
        !existingGroupsByMemberNameTopics.includes(topic) &&
        !existingDmTopics.includes(topic)
    );

    items.push(
      ...uniqueGroupNameMatches
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS)
    );

    // 4. Add user profiles that aren't already in DMs
    const profilesNotInDms = searchConvosUsersData?.inboxIds
      .map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }))
      .filter((item) => {
        // Skip if the profile is already in a DM conversation
        return !existingDmTopics.some((topic) => {
          const members = getGroupMembersQueryData({
            account: getCurrentAccount()!,
            topic,
          });
          const peerInboxId = getDmPeerInboxIdQueryData({
            account: getCurrentAccount()!,
            topic,
          });

          return (
            peerInboxId === item.inboxId ||
            members?.ids.some((inboxId) => inboxId === item.inboxId)
          );
        });
      });

    items.push(...(profilesNotInDms ?? []));

    return items;
  }, [
    existingConversationMembershipSearchResults,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
  ]);

  const isLoadingSearchResults =
    isSearchingExistingConversations || isSearchingConvosUsers;

  return (
    <Container>
      <FlatList
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <VStack
            style={{
              paddingBottom: insets.bottom,
              flex: 1,
            }}
          >
            {isLoadingSearchResults ? (
              <Loader style={{ flex: 1 }} />
            ) : searchQuery ? (
              <EmptyState
                title="Oops"
                description={
                  searchConvosUsersData?.message ||
                  `Couldn't find what you are looking for`
                }
              />
            ) : null}
          </VStack>
        }
        data={listData}
        renderItem={({ item }) => {
          if (item.type === "dm") {
            return (
              <ConversationSearchResultsListItemDm
                conversationTopic={item.conversationTopic}
              />
            );
          }
          if (item.type === "group") {
            return (
              <ConversationSearchResultsListItemGroup
                conversationTopic={item.conversationTopic}
              />
            );
          }
          if (item.type === "profile") {
            return (
              <ConversationSearchResultsListItemUser inboxId={item.inboxId} />
            );
          }
          const _ensureNever: never = item.type;
          return null;
        }}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => {
          if (item.type === "dm") {
            return `dm-${item.conversationTopic}`;
          }
          if (item.type === "group") {
            return `group-${item.conversationTopic}`;
          }
          if (item.type === "profile") {
            return `profile-${item.inboxId}`;
          }
          const _ensureNever: never = item.type;
          throw new Error("Invalid item type");
        }}
      />
    </Container>
  );
}

const Container = memo(function Container(props: { children: ReactNode }) {
  const { children } = props;

  const { theme } = useAppTheme();

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
          backgroundColor: theme.colors.background.surface,
        },
      ]}
    >
      {children}
    </AnimatedVStack>
  );
});
