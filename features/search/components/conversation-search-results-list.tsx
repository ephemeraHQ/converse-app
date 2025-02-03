import { Avatar } from "@/components/Avatar";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { AnimatedVStack } from "@/design-system/VStack";
import {
  useConversationStore,
  useConversationStoreContext,
} from "@/features/conversation/conversation.store-context";
import { useSearchByConversationMembershipQuery } from "@/features/search/search-by-conversation-membership/use-search-by-conversation-membership.query";
import { useSearchConvosUsersQuery } from "@/features/search/use-search-convos-users-query";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useConversationQuery } from "@/queries/conversation-query";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { useGroupQuery } from "@/queries/useGroupQuery";
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
import { ConversationSearchResultsListItemUser } from "./conversation-search-results-list-item-user";
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

  const selectedAddresses: string[] = [];
  const currentUserAddress = useCurrentAccount()!;

  const { convosSearchResults, message, areSearchResultsLoading } =
    useSearchConvosUsersQuery({
      searchQuery,
      addressesToOmit: [...selectedAddresses, currentUserAddress],
    });

  const {
    data: existingConversationMembershipSearchResults,
    isLoading: isConversationMembershipLoading,
  } = useSearchByConversationMembershipQuery({
    searchQuery,
  });

  const sections = useMemo(() => {
    const sections: SearchSection[] = [];

    if (!existingConversationMembershipSearchResults) {
      return sections;
    }

    if (!convosSearchResults) {
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

    // Other results
    if (convosSearchResults.length > 0) {
      sections.push({
        title: "Other Results",
        data: convosSearchResults.map((topic) => ({
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
  }, [existingConversationMembershipSearchResults, convosSearchResults]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <SectionHeader title={section.title} />
    ),
    []
  );

  return (
    <Container>
      <SectionList
        stickyHeaderHiddenOnScroll={false}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        sections={sections}
        renderItem={({ item }) => {
          if (item.type === "dm") {
            return <DmSearchResult conversationTopic={item.data} />;
          }
          if (item.type === "group") {
            return <GroupSearchResult conversationTopic={item.data} />;
          }
          if (item.type === "profile") {
            return <ProfileSearchResult socials={item.data} />;
          }
          const _ensureNever: never = item.type;
          return null;
        }}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
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

const ProfileSearchResult = memo(function ProfileSearchResult({
  inboxId,
}: {
  inboxId: InboxId;
}) {
  return <ConversationSearchResultsListItemUser inboxId={inboxId} />;
});

const DmSearchResult = memo(function DmSearchResult({
  conversationTopic,
}: {
  conversationTopic: ConversationTopic;
}) {
  const currentAccount = useCurrentAccount()!;

  const { data: conversation } = useConversationQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: `DmSearchResult-${conversationTopic}`,
  });

  const { data: inboxId } = useDmPeerInboxIdQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: `DmSearchResult-${conversationTopic}`,
  });

  const conversationStore = useConversationStore();

  const handlePress = useCallback(() => {
    conversationStore.setState({
      topic: conversationTopic,
    });
  }, [conversationStore, conversationTopic]);

  return (
    <Pressable onPress={handlePress}>
      <ConversationSearchResultsListItemUser inboxId={inboxId!} />
    </Pressable>
  );
});

const GroupSearchResult = memo(function GroupSearchResult({
  conversationTopic,
}: {
  conversationTopic: ConversationTopic;
}) {
  const { theme, themed } = useAppTheme();

  const currentAccount = useCurrentAccount()!;

  const { data: group } = useGroupQuery({
    account: currentAccount,
    topic: conversationTopic,
  });

  const { members } = useGroupMembers(conversationTopic);

  const handlePress = useCallback(() => {
    // TODO: Implement group selection logic
  }, []);

  return (
    <Pressable onPress={handlePress}>
      <View style={themed(searchResultsStyles.$groupContainer)}>
        <Avatar
          uri={group?.imageUrlSquare}
          size={theme.avatarSize.md}
          style={themed(searchResultsStyles.$avatar)}
          name={group?.name}
        />
        <View style={themed(searchResultsStyles.$groupTextContainer)}>
          <Text
            preset="bodyBold"
            style={themed(searchResultsStyles.$primaryText)}
            numberOfLines={1}
          >
            {group?.name}
          </Text>
          <Text
            preset="formLabel"
            style={themed(searchResultsStyles.$secondaryText)}
            numberOfLines={1}
          >
            {members?.ids
              .slice(0, 3)
              .map((id) => members?.byId[id]?.addresses[0])
              .filter((address) => address !== currentAccount)
              .join(", ")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
