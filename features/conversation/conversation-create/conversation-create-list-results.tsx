import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { memo, useCallback, useMemo } from "react"
import { Alert, ListRenderItem } from "react-native"
import { useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated"
import { AnimatedVStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  useConversationStore,
  useConversationStoreContext,
} from "@/features/conversation/conversation-chat/conversation.store-context"
import { useSearchExistingDmsQuery } from "@/features/conversation/conversation-create/queries/search-existing-dms.query"
import { useSearchExistingGroupsByGroupMembersQuery } from "@/features/conversation/conversation-create/queries/search-existing-groups-by-group-members.query"
import { useSearchExistingGroupsByGroupNameQuery } from "@/features/conversation/conversation-create/queries/search-existing-groups-by-group-name.query"
import { inboxIdIsPartOfConversationUsingCacheData } from "@/features/conversation/utils/inbox-id-is-part-of-converastion"
import { useSearchConvosUsersQuery } from "@/features/search-users/use-search-convos-users"
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api"
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { useAnimatedKeyboard } from "@/hooks/use-animated-keyboard"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { isEthereumAddress } from "@/utils/evm/address"
import { SearchUsersResultsList } from "../../search-users/search-users-results-list"
import { SearchUsersResultsListItemEthAddress } from "../../search-users/search-users-results-list-item-eth-address"
import { SearchUsersResultsListItemGroup } from "../../search-users/search-users-results-list-item-group"
import { SearchUsersResultsListItemNoConvosUser } from "../../search-users/search-users-results-list-item-no-convos-user"
import { SearchUsersResultsListItemUser } from "../../search-users/search-users-results-list-item-user"
import { SearchUsersResultsListItemUserDm } from "../../search-users/search-users-results-list-item-user-dm"

// Because we want a mix of DMs, groups, and profiles
const MAX_INITIAL_RESULTS = 3

type ISearchResultItemDm = {
  type: "dm"
  conversationTopic: ConversationTopic
}

type ISearchResultItemGroup = {
  type: "group"
  conversationTopic: ConversationTopic
}

type ISearchResultItemProfile = {
  type: "profile"
  inboxId: InboxId
}

type ISearchResultItemSocialProfile = {
  type: "socialProfile"
  profile: ISocialProfile
}

type ISearchResultItemEthAddress = {
  type: "ethAddress"
  address: string
}

type SearchResultItem =
  | ISearchResultItemDm
  | ISearchResultItemGroup
  | ISearchResultItemProfile
  | ISearchResultItemSocialProfile
  | ISearchResultItemEthAddress

function searchResultIsDm(item: SearchResultItem): item is ISearchResultItemDm {
  return item.type === "dm"
}

function searchResultIsGroup(item: SearchResultItem): item is ISearchResultItemGroup {
  return item.type === "group"
}

function searchResultIsProfile(item: SearchResultItem): item is ISearchResultItemProfile {
  return item.type === "profile"
}

function searchResultIsSocialProfile(
  item: SearchResultItem,
): item is ISearchResultItemSocialProfile {
  return item.type === "socialProfile"
}

function searchResultIsEthAddress(item: SearchResultItem): item is ISearchResultItemEthAddress {
  return item.type === "ethAddress"
}

const SearchUsersResultsListItemUserDmWrapper = memo(
  function SearchUsersResultsListItemUserDmWrapper(props: {
    conversationTopic: ConversationTopic
  }) {
    const conversationStore = useConversationStore()

    const handlePress = useCallback(() => {
      conversationStore.setState({
        searchTextValue: "",
        searchSelectedUserInboxIds: [],
        topic: props.conversationTopic,
        isCreatingNewConversation: false,
      })
    }, [conversationStore, props.conversationTopic])

    return (
      <SearchUsersResultsListItemUserDm
        conversationTopic={props.conversationTopic}
        onPress={handlePress}
      />
    )
  },
)

const SearchUsersResultsListItemGroupWrapper = memo(
  function SearchUsersResultsListItemGroupWrapper(props: { conversationTopic: ConversationTopic }) {
    const conversationStore = useConversationStore()

    const handlePress = useCallback(() => {
      conversationStore.setState({
        searchTextValue: "",
        searchSelectedUserInboxIds: [],
        topic: props.conversationTopic,
        isCreatingNewConversation: false,
      })
    }, [conversationStore, props.conversationTopic])

    return (
      <SearchUsersResultsListItemGroup
        conversationTopic={props.conversationTopic}
        onPress={handlePress}
      />
    )
  },
)

const SearchUsersResultsListItemUserWrapper = memo(
  function SearchUsersResultsListItemUserWrapper(props: { inboxId: InboxId }) {
    const conversationStore = useConversationStore()

    const handlePress = useCallback(() => {
      conversationStore.setState({
        searchTextValue: "",
        searchSelectedUserInboxIds: [
          ...(conversationStore.getState().searchSelectedUserInboxIds ?? []),
          props.inboxId!,
        ],
      })
    }, [conversationStore, props.inboxId])

    return <SearchUsersResultsListItemUser inboxId={props.inboxId} onPress={handlePress} />
  },
)

const SearchUsersResultsListItemNoConvosUserWrapper = memo(
  function SearchUsersResultsListItemNoConvosUserWrapper(props: { socialProfile: ISocialProfile }) {
    const conversationStore = useConversationStore()

    const currentSender = useSafeCurrentSender()

    const { data: inboxId, isLoading: isLoadingInboxId } = useXmtpInboxIdFromEthAddressQuery({
      clientEthAddress: currentSender.ethereumAddress,
      targetEthAddress: props.socialProfile.address,
    })

    const handlePress = useCallback(() => {
      if (inboxId) {
        conversationStore.setState({
          searchTextValue: "",
          searchSelectedUserInboxIds: [
            ...(conversationStore.getState().searchSelectedUserInboxIds ?? []),
            inboxId,
          ],
        })
      } else {
        Alert.alert("This user is not on XMTP yet!")
      }
    }, [inboxId, conversationStore])

    if (isLoadingInboxId) {
      return null
    }

    return (
      <SearchUsersResultsListItemNoConvosUser
        socialProfile={props.socialProfile}
        onPress={handlePress}
      />
    )
  },
)

const SearchUsersResultsListItemEthAddressWrapper = memo(
  function SearchUsersResultsListItemEthAddressWrapper(props: { ethAddress: string }) {
    const { ethAddress } = props

    const conversationStore = useConversationStore()

    const currentSender = useSafeCurrentSender()

    const { data: inboxId, isLoading: isLoadingInboxId } = useXmtpInboxIdFromEthAddressQuery({
      clientEthAddress: currentSender.ethereumAddress,
      targetEthAddress: ethAddress,
    })

    const handlePress = () => {
      if (!inboxId) {
        Alert.alert("This user is not on XMTP yet!")
        return
      }

      conversationStore.setState({
        searchTextValue: "",
        searchSelectedUserInboxIds: [
          ...(conversationStore.getState().searchSelectedUserInboxIds ?? []),
          inboxId,
        ],
      })
    }

    if (isLoadingInboxId) {
      return null
    }

    return <SearchUsersResultsListItemEthAddress ethAddress={ethAddress} onPress={handlePress} />
  },
)

export const ConversationCreateListResults = memo(function ConversationCreateListResults() {
  const searchTextValue = useConversationStoreContext((state) => state.searchTextValue)
  const selectedSearchUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds,
  )

  const currentUserInboxId = useSafeCurrentSender().inboxId

  const { data: searchConvosUsersData, isLoading: isSearchingConvosUsers } =
    useSearchConvosUsersQuery({
      searchQuery: searchTextValue,
      inboxIdsToOmit: [...selectedSearchUserInboxIds, currentUserInboxId],
    })

  const { data: existingDmTopics = [], isLoading: isLoadingExistingDmTopics } =
    useSearchExistingDmsQuery({
      searchQuery: searchTextValue,
      inboxId: currentUserInboxId,
    })

  const {
    data: socialProfilesForEthAddress = [],
    isLoading: isLoadingSocialProfilesForEthAddress,
  } = useSocialProfilesForAddressQuery({
    ethAddress: searchTextValue,
  })

  const { data: existingGroupsByGroupNameTopics = [], isLoading: isLoadingExistingGroupsByName } =
    useSearchExistingGroupsByGroupNameQuery({
      searchQuery: searchTextValue,
      searcherInboxId: currentUserInboxId,
    })

  const {
    data: existingGroupsByMemberNameTopics = [],
    isLoading: isLoadingExistingGroupsByMembers,
  } = useSearchExistingGroupsByGroupMembersQuery({
    searchQuery: searchTextValue,
    searcherInboxId: currentUserInboxId,
  })

  const isEthAddress = useMemo(() => {
    return isEthereumAddress(searchTextValue)
  }, [searchTextValue])

  const listData = useMemo(() => {
    const items: SearchResultItem[] = []

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
      )
    }

    // 2. Add groups where member names match the search query
    items.push(
      ...existingGroupsByMemberNameTopics
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS),
    )

    // 3. Add groups where group names match the search query if not already in the list
    items.push(
      ...existingGroupsByGroupNameTopics
        .filter(
          (conversationTopic) =>
            !items.some(
              (item) => item.type === "group" && item.conversationTopic === conversationTopic,
            ),
        )
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS),
    )

    // 4. Add user profiles that aren't already in DMs
    const profilesNotInDms = searchConvosUsersData
      ?.map((profile) => ({
        type: "profile" as const,
        inboxId: profile.xmtpId,
      }))
      .filter(({ inboxId }) => {
        const addedDms = items.filter(searchResultIsDm)
        // Skip if the profile is already in a DM conversation
        return !addedDms.some(({ conversationTopic }) => {
          return inboxIdIsPartOfConversationUsingCacheData({
            inboxId,
            conversationTopic,
          })
        })
      })

    items.push(...(profilesNotInDms ?? []))

    // 5. Add social profiles only if we don't have any conversation users
    if (searchConvosUsersData?.length === 0 && socialProfilesForEthAddress.length > 0) {
      items.push(
        ...socialProfilesForEthAddress.map((profile) => ({
          type: "socialProfile" as const,
          profile,
        })),
      )
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
        address: searchTextValue,
      })
    }

    return items
  }, [
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
    socialProfilesForEthAddress,
    searchTextValue,
    isEthAddress,
  ])

  const isStillLoadingSearchResults =
    isLoadingExistingDmTopics ||
    isLoadingExistingGroupsByName ||
    isLoadingExistingGroupsByMembers ||
    isSearchingConvosUsers ||
    isLoadingSocialProfilesForEthAddress

  const renderItem: ListRenderItem<SearchResultItem> = ({ item }) => {
    if (searchResultIsDm(item)) {
      return <SearchUsersResultsListItemUserDmWrapper conversationTopic={item.conversationTopic} />
    }
    if (searchResultIsGroup(item)) {
      return <SearchUsersResultsListItemGroupWrapper conversationTopic={item.conversationTopic} />
    }
    if (searchResultIsProfile(item)) {
      return <SearchUsersResultsListItemUserWrapper inboxId={item.inboxId} />
    }
    if (searchResultIsSocialProfile(item)) {
      return <SearchUsersResultsListItemNoConvosUserWrapper socialProfile={item.profile} />
    }
    if (searchResultIsEthAddress(item)) {
      return <SearchUsersResultsListItemEthAddressWrapper ethAddress={item.address} />
    }
    const _ensureNever: never = item
    return null
  }

  const keyExtractor = (item: SearchResultItem, index: number): string => {
    if (searchResultIsDm(item)) {
      return `dm-${item.conversationTopic}`
    }
    if (searchResultIsGroup(item)) {
      return `group-${item.conversationTopic}`
    }
    if (searchResultIsProfile(item)) {
      return `profile-${item.inboxId}`
    }
    if (searchResultIsSocialProfile(item)) {
      return `social-profile-${item.profile.type}-${item.profile.address}`
    }
    if (searchResultIsEthAddress(item)) {
      return `eth-address-${item.address}`
    }
    const _ensureNever: never = item
    throw new Error("Invalid item type")
  }

  return (
    <Container>
      <SearchUsersResultsList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        isLoading={isStillLoadingSearchResults}
        searchText={searchTextValue}
      />
    </Container>
  )
})

const Container = memo(function Container(props: { children: React.ReactNode }) {
  const { children } = props

  const { theme } = useAppTheme()
  const { height: keyboardHeightAV } = useAnimatedKeyboard()

  const searchQuery = useConversationStoreContext((state) => state.searchTextValue)

  const containerVisibleAV = useDerivedValue(() => {
    if (!!searchQuery) {
      return withSpring(1, {
        stiffness: theme.animation.spring.stiffness,
        damping: theme.animation.spring.damping,
      })
    }

    // Instant is better UX than animating to 0
    return 0
  }, [searchQuery])

  const containerAS = useAnimatedStyle(() => ({
    bottom: keyboardHeightAV.value,
    opacity: containerVisibleAV.value,
    zIndex: !!searchQuery ? 1 : 0,
  }))

  return (
    <AnimatedVStack
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
  )
})
