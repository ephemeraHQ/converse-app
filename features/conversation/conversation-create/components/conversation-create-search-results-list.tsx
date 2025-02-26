import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { memo, ReactNode, useMemo } from "react";
import { FlatList } from "react-native";
import {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Center } from "@/design-system/Center";
import { EmptyState } from "@/design-system/empty-state";
import { Loader } from "@/design-system/loader";
import { AnimatedVStack } from "@/design-system/VStack";
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store";
import { useSearchConvosUsersQuery } from "@/features/conversation/conversation-create/hooks/use-search-convos-users";
import { useConversationStoreContext } from "@/features/conversation/conversation.store-context";
import { inboxIdIsPartOfConversationUsingCacheData } from "@/features/conversation/utils/inbox-id-is-part-of-converastion";
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api";
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/use-app-theme";
import { useSearchExistingDmsQuery } from "../queries/search-existing-dms.query";
import { useSearchExistingGroupsByGroupMembersQuery } from "../queries/search-existing-groups-by-group-members.query";
import { useSearchExistingGroupsByGroupNameQuery } from "../queries/search-existing-groups-by-group-name.query";
import { ConversationSearchResultsListItemEthAddress } from "./conversation-create-search-results-list-item-eth-address";
import { ConversationSearchResultsListItemGroup } from "./conversation-create-search-results-list-item-group";
import { ConversationSearchResultsListItemNoConvosUser } from "./conversation-create-search-results-list-item-no-convos-user";
import { ConversationSearchResultsListItemUser } from "./conversation-create-search-results-list-item-user";
import { ConversationSearchResultsListItemDm } from "./conversation-create-search-results-list-item-user-dm";

// Because we want a mix of DMs, groups, and profiles
const MAX_INITIAL_RESULTS = 3;

// Simple regex to check if a string might be an Ethereum address
const ETH_ADDRESS_REGEX = /^(0x)?[0-9a-fA-F]{40}$/;

function isEthereumAddress(value: string): boolean {
  return ETH_ADDRESS_REGEX.test(value);
}

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

type ISearchResultItemSocialProfile = {
  type: "socialProfile";
  profile: ISocialProfile;
};

type ISearchResultItemEthAddress = {
  type: "ethAddress";
  address: string;
};

type SearchResultItem =
  | ISearchResultItemDm
  | ISearchResultItemGroup
  | ISearchResultItemProfile
  | ISearchResultItemSocialProfile
  | ISearchResultItemEthAddress;

function searchResultIsDm(item: SearchResultItem): item is ISearchResultItemDm {
  return item.type === "dm";
}

function searchResultIsGroup(
  item: SearchResultItem,
): item is ISearchResultItemGroup {
  return item.type === "group";
}

function searchResultIsProfile(
  item: SearchResultItem,
): item is ISearchResultItemProfile {
  return item.type === "profile";
}

function searchResultIsSocialProfile(
  item: SearchResultItem,
): item is ISearchResultItemSocialProfile {
  return item.type === "socialProfile";
}

function searchResultIsEthAddress(
  item: SearchResultItem,
): item is ISearchResultItemEthAddress {
  return item.type === "ethAddress";
}

export function ConversationSearchResultsList() {
  const insets = useSafeAreaInsets();

  const searchQuery = useConversationStoreContext(
    (state) => state.searchTextValue,
  );

  const selectedSearchUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds,
  );

  const currentUserInboxId = useSafeCurrentSender().inboxId;

  const { data: searchConvosUsersData, isLoading: isSearchingConvosUsers } =
    useSearchConvosUsersQuery({
      searchQuery,
      inboxIdsToOmit: [...selectedSearchUserInboxIds, currentUserInboxId],
    });

  const { data: existingDmTopics = [], isLoading: isLoadingExistingDmTopics } =
    useSearchExistingDmsQuery({
      searchQuery,
      inboxId: currentUserInboxId,
    });

  const {
    data: socialProfilesForEthAddress = [],
    isLoading: isLoadingSocialProfilesForEthAddress,
  } = useSocialProfilesForAddressQuery({
    ethAddress: searchQuery,
  });

  const {
    data: existingGroupsByGroupNameTopics = [],
    isLoading: isLoadingExistingGroupsByName,
  } = useSearchExistingGroupsByGroupNameQuery({
    searchQuery,
    searcherInboxId: currentUserInboxId,
  });

  const {
    data: existingGroupsByMemberNameTopics = [],
    isLoading: isLoadingExistingGroupsByMembers,
  } = useSearchExistingGroupsByGroupMembersQuery({
    searchQuery,
    searcherInboxId: currentUserInboxId,
  });

  const isEthAddress = useMemo(() => {
    return isEthereumAddress(searchQuery);
  }, [searchQuery]);

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
          .slice(0, MAX_INITIAL_RESULTS),
      );
    }

    // 2. Add groups where member names match the search query
    items.push(
      ...existingGroupsByMemberNameTopics
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS),
    );

    // 3. Add groups where group names match the search query if not already in the list
    items.push(
      ...existingGroupsByGroupNameTopics
        .filter(
          (conversationTopic) =>
            !items.some(
              (item) =>
                item.type === "group" &&
                item.conversationTopic === conversationTopic,
            ),
        )
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS),
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

    // 5. Add social profiles only if we don't have any conversation users
    if (
      searchConvosUsersData?.length === 0 &&
      socialProfilesForEthAddress.length > 0
    ) {
      items.push(
        ...socialProfilesForEthAddress.map((profile) => ({
          type: "socialProfile" as const,
          profile,
        })),
      );
    }

    // 6. Add raw Ethereum address if:
    // - The search query is an Ethereum address
    // - We don't have any social profiles for it
    // - We don't have any conversation users
    if (
      isEthAddress &&
      socialProfilesForEthAddress.length === 0 &&
      searchConvosUsersData?.length === 0
    ) {
      items.push({
        type: "ethAddress",
        address: searchQuery,
      });
    }

    return items;
  }, [
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
    socialProfilesForEthAddress,
    searchQuery,
    isEthAddress,
  ]);

  const isStillLoadingSearchResults =
    isLoadingExistingDmTopics ||
    isLoadingExistingGroupsByName ||
    isLoadingExistingGroupsByMembers ||
    isSearchingConvosUsers ||
    isLoadingSocialProfilesForEthAddress;

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
          if (searchResultIsSocialProfile(item)) {
            return (
              <ConversationSearchResultsListItemNoConvosUser
                socialProfile={item.profile}
              />
            );
          }
          if (searchResultIsEthAddress(item)) {
            return (
              <ConversationSearchResultsListItemEthAddress
                ethAddress={item.address}
              />
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
          if (searchResultIsSocialProfile(item)) {
            return `social-profile-${item.profile.type}-${item.profile.address}`;
          }
          if (searchResultIsEthAddress(item)) {
            return `eth-address-${item.address}`;
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
    (state) => state.searchTextValue,
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
