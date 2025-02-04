import { Text } from "@/design-system/Text";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { EmptyState } from "@/design-system/empty-state";
import { Loader } from "@/design-system/loader";
import { useConversationStoreContext } from "@/features/conversation/conversation.store-context";
import { useSearchByConversationMembershipQuery } from "@/features/search/search-by-conversation-membership/use-search-by-conversation-membership.query";
import { useSearchConvosUsersQuery } from "@/features/search/use-search-convos-users-query";
import { useSafeCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { ReactNode, memo, useCallback, useMemo } from "react";
import { SectionList, View } from "react-native";
import {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConversationSearchResultsListItemGroup } from "./conversation-search-results-list-item-group";
import { ConversationSearchResultsListItemUser } from "./conversation-search-results-list-item-user";
import { ConversationSearchResultsListItemDm } from "./conversation-search-results-list-item-user-dm";
import { searchResultsStyles } from "./search-results.styles";

const MAX_INITIAL_RESULTS = 5;

type SearchResultItem =
  | {
      type: "dm" | "group";
      data: ConversationTopic;
    }
  | {
      type: "profile";
      data: InboxId;
    };

type SearchSection = {
  title: string;
  data: SearchResultItem[];
};

export function ConversationSearchResultsList() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const searchQuery = useConversationStoreContext(
    (state) => state.searchTextValue
  );

  const selectedSearchUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds
  );

  const currentUserInboxId = useSafeCurrentAccountInboxId();

  const { data: searchConvosUsersData, isLoading: isSearchingConvosUsers } =
    useSearchConvosUsersQuery({
      searchQuery,
      inboxIdsToOmit: [...selectedSearchUserInboxIds, currentUserInboxId],
    });

  const {
    data: existingConversationMembershipSearchResults,
    isLoading: isSearchingExistingConversations,
  } = useSearchByConversationMembershipQuery({
    searchQuery,
  });

  const sections = useMemo(() => {
    const sections: SearchSection[] = [];

    // Wait until we finish loading both existing and searched results
    if (
      !existingConversationMembershipSearchResults ||
      !searchConvosUsersData
    ) {
      return sections;
    }

    // If we have selected users, only show "Other Results" section with profiles
    if (selectedSearchUserInboxIds.length > 0) {
      sections.push({
        title: "Other Results",
        data: searchConvosUsersData?.inboxIds.map((inboxId) => ({
          type: "profile",
          data: inboxId,
        })),
      });

      return sections;
    }

    const {
      existingDmTopics,
      existingGroupsByMemberNameTopics,
      existingGroupsByGroupNameTopics,
    } = existingConversationMembershipSearchResults;

    // Recent DMs
    const existingDmSearchResultsToShow = existingDmTopics.slice(
      0,
      MAX_INITIAL_RESULTS
    );
    if (existingDmSearchResultsToShow.length > 0) {
      sections.push({
        title: "Recent Chats",
        data: existingDmSearchResultsToShow.map((topic) => ({
          type: "dm",
          data: topic,
        })),
      });
    }

    // Groups with matching member names
    const existingGroupMemberNameSearchResultsToShow =
      existingGroupsByMemberNameTopics.slice(0, MAX_INITIAL_RESULTS);
    if (existingGroupMemberNameSearchResultsToShow.length > 0) {
      sections.push({
        title: "Groups with matching members",
        data: existingGroupMemberNameSearchResultsToShow.map((topic) => ({
          type: "group",
          data: topic,
        })),
      });
    }

    // Groups with matching names
    const existingGroupNameSearchResultsToShow =
      existingGroupsByGroupNameTopics.slice(0, MAX_INITIAL_RESULTS);
    if (existingGroupNameSearchResultsToShow.length > 0) {
      sections.push({
        title: "Groups with matching names",
        data: existingGroupNameSearchResultsToShow.map((topic) => ({
          type: "group",
          data: topic,
        })),
      });
    }

    // Convos users
    if (searchConvosUsersData?.inboxIds.length > 0) {
      sections.push({
        title: "Convos Users",
        data: searchConvosUsersData?.inboxIds.map((inboxId) => ({
          type: "profile",
          data: inboxId,
        })),
      });
    }

    // Remaining DMs
    const remainingDmSearchResults =
      existingDmTopics.slice(MAX_INITIAL_RESULTS);
    if (remainingDmSearchResults.length > 0) {
      sections.push({
        title: "Other Matching Chats",
        data: remainingDmSearchResults.map((topic) => ({
          type: "dm",
          data: topic,
        })),
      });
    }

    // Remaining group results with matching members
    const remainingGroupMemberResults =
      existingGroupsByMemberNameTopics.slice(MAX_INITIAL_RESULTS);
    if (remainingGroupMemberResults.length > 0) {
      sections.push({
        title: "Other Groups with matching members",
        data: remainingGroupMemberResults.map((topic) => ({
          type: "group",
          data: topic,
        })),
      });
    }

    // Remaining group results with matching names
    const remainingGroupNameResults =
      existingGroupsByGroupNameTopics.slice(MAX_INITIAL_RESULTS);
    if (remainingGroupNameResults.length > 0) {
      sections.push({
        title: "Other Groups with matching names",
        data: remainingGroupNameResults.map((topic) => ({
          type: "group",
          data: topic,
        })),
      });
    }

    return sections;
  }, [
    existingConversationMembershipSearchResults,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
  ]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <SectionHeader title={section.title} />
    ),
    []
  );

  const isLoadingSearchResults =
    isSearchingExistingConversations || isSearchingConvosUsers;

  return (
    <Container>
      <SectionList
        stickyHeaderHiddenOnScroll={false}
        stickySectionHeadersEnabled={false}
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
        sections={sections}
        renderItem={({ item }) => {
          if (item.type === "dm") {
            return (
              <ConversationSearchResultsListItemDm
                conversationTopic={item.data}
              />
            );
          }
          if (item.type === "group") {
            return (
              <ConversationSearchResultsListItemGroup
                conversationTopic={item.data}
              />
            );
          }
          if (item.type === "profile") {
            return (
              <ConversationSearchResultsListItemUser inboxId={item.data} />
            );
          }
          const _ensureNever: never = item.type;
          return null;
        }}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => `${item.type}-${index}`}
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

function SectionHeader({ title }: { title: string }) {
  const { themed } = useAppTheme();

  return (
    <View style={themed(searchResultsStyles.$sectionHeader)}>
      <Text
        preset="formLabel"
        style={themed(searchResultsStyles.$sectionTitle)}
      >
        {title}
      </Text>
    </View>
  );
}
