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
import { useDmQuery } from "@/features/dm/dm.query"
import { useSearchConvosUsersQuery } from "@/features/search-users/queries/search-convos-users.query"
import {
  useBaseNameResolution,
  useEnsNameResolution,
  useUnstoppableDomainNameResolution,
} from "@/features/social-profiles/identity-resolution.query"
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { useAnimatedKeyboard } from "@/hooks/use-animated-keyboard"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { IEthereumAddress, isEthereumAddress } from "@/utils/evm/address"
import { SearchUsersResultsList } from "../../search-users/search-users-results-list"
import { SearchUsersResultsListItemEthAddress } from "../../search-users/search-users-results-list-item-eth-address"
import { SearchUsersResultsListItemGroup } from "../../search-users/search-users-results-list-item-group"
import { SearchUsersResultsListItemUser } from "../../search-users/search-users-results-list-item-user"
import { SearchUsersResultsListItemUserDm } from "../../search-users/search-users-results-list-item-user-dm"

// Because we want a mix of DMs, groups, and profiles
const MAX_INITIAL_RESULTS = 3

type ISearchResultItemDm = {
  type: "dm"
  xmtpConversationId: IXmtpConversationId
}

type ISearchResultItemGroup = {
  type: "group"
  xmtpConversationId: IXmtpConversationId
}

type ISearchResultItemProfile = {
  type: "profile"
  inboxId: IXmtpInboxId
}

type ISearchResultItemExternalIdentity = {
  type: "external_identity"
  address: IEthereumAddress
}

type SearchResultItem =
  | ISearchResultItemDm
  | ISearchResultItemGroup
  | ISearchResultItemProfile
  | ISearchResultItemExternalIdentity

function searchResultIsDm(item: SearchResultItem): item is ISearchResultItemDm {
  return item.type === "dm"
}

function searchResultIsGroup(item: SearchResultItem): item is ISearchResultItemGroup {
  return item.type === "group"
}

function searchResultIsProfile(item: SearchResultItem): item is ISearchResultItemProfile {
  return item.type === "profile"
}

function searchResultIsExternalIdentity(
  item: SearchResultItem,
): item is ISearchResultItemExternalIdentity {
  return item.type === "external_identity"
}

const SearchUsersResultsListItemUserDmWrapper = memo(
  function SearchUsersResultsListItemUserDmWrapper(props: {
    xmtpConversationId: IXmtpConversationId
  }) {
    const { xmtpConversationId } = props

    const conversationStore = useConversationStore()

    const currentSender = useSafeCurrentSender()

    const { data: dm, isLoading: isLoadingDm } = useDmQuery({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
    })

    const handlePress = useCallback(() => {
      if (dm?.peerInboxId) {
        conversationStore.setState({
          searchTextValue: "",
          searchSelectedUserInboxIds: [dm.peerInboxId],
        })
      } else {
        conversationStore.setState({
          searchTextValue: "",
          searchSelectedUserInboxIds: [],
          xmtpConversationId,
          isCreatingNewConversation: false,
        })
      }
    }, [conversationStore, dm?.peerInboxId, xmtpConversationId])

    if (isLoadingDm) {
      return null
    }

    return (
      <SearchUsersResultsListItemUserDm
        xmtpConversationId={xmtpConversationId}
        onPress={handlePress}
      />
    )
  },
)

const SearchUsersResultsListItemGroupWrapper = memo(
  function SearchUsersResultsListItemGroupWrapper(props: {
    xmtpConversationId: IXmtpConversationId
  }) {
    const { xmtpConversationId } = props

    const conversationStore = useConversationStore()

    const handlePress = useCallback(() => {
      conversationStore.setState({
        searchTextValue: "",
        searchSelectedUserInboxIds: [],
        xmtpConversationId,
        isCreatingNewConversation: false,
      })
    }, [conversationStore, xmtpConversationId])

    return (
      <SearchUsersResultsListItemGroup
        xmtpConversationId={xmtpConversationId}
        onPress={handlePress}
      />
    )
  },
)

const SearchUsersResultsListItemUserWrapper = memo(
  function SearchUsersResultsListItemUserWrapper(props: { inboxId: IXmtpInboxId }) {
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

const SearchUsersResultsListItemExternalIdentityWrapper = memo(
  function SearchUsersResultsListItemExternalIdentityWrapper(props: {
    externalIdentity: ISearchResultItemExternalIdentity
  }) {
    const { externalIdentity } = props
    const conversationStore = useConversationStore()
    const currentSender = useSafeCurrentSender()

    const { data: inboxId, isLoading: isLoadingInboxId } = useXmtpInboxIdFromEthAddressQuery({
      clientInboxId: currentSender.inboxId,
      targetEthAddress: externalIdentity.address,
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
      <SearchUsersResultsListItemEthAddress
        ethAddress={externalIdentity.address}
        onPress={handlePress}
      />
    )
  },
)

export const ConversationCreateListResults = memo(function ConversationCreateListResults() {
  const searchTextValue = useConversationStoreContext((state) => state.searchTextValue)
  const selectedSearchUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds,
  )

  const currentUserInboxId = useSafeCurrentSender().inboxId

  const { data: existingGroupsByGroupName = [], isLoading: isLoadingExistingGroupsByName } =
    useSearchExistingGroupsByGroupNameQuery({
      searchQuery: searchTextValue,
      searcherInboxId: currentUserInboxId,
    })

  const { data: existingGroupsByMemberName = [], isLoading: isLoadingExistingGroupsByMembers } =
    useSearchExistingGroupsByGroupMembersQuery({
      searchQuery: searchTextValue,
      searcherInboxId: currentUserInboxId,
    })

  const { data: existingDm = [], isLoading: isLoadingExistingDm } = useSearchExistingDmsQuery({
    searchQuery: searchTextValue,
    inboxId: currentUserInboxId,
  })

  const { data: searchConvosUsersData, isLoading: isSearchingConvosUsers } =
    useSearchConvosUsersQuery({
      searchQuery: searchTextValue,
      inboxIdsToOmit: [...selectedSearchUserInboxIds, currentUserInboxId],
    })

  const { data: ensEthAddressResolution } = useEnsNameResolution(searchTextValue)
  const { data: baseEthAddressResolution } = useBaseNameResolution(searchTextValue)
  const { data: unstoppableDomainEthAddressResolution } =
    useUnstoppableDomainNameResolution(searchTextValue)

  const listData = useMemo(() => {
    const items: SearchResultItem[] = []

    // 1. Add DMs first
    // But if we have selected users in the search bar, don't show DMs
    // Because otherwise the user would have selected the existing DM already...
    if (selectedSearchUserInboxIds.length === 0) {
      items.push(
        ...existingDm
          .map((xmtpConversationId) => ({
            type: "dm" as const,
            xmtpConversationId,
          }))
          .slice(0, MAX_INITIAL_RESULTS),
      )
    }

    // 2. Add groups where member names match the search query
    items.push(
      ...existingGroupsByMemberName
        .map((xmtpConversationId) => ({
          type: "group" as const,
          xmtpConversationId,
        }))
        .slice(0, MAX_INITIAL_RESULTS),
    )

    // 3. Add groups where group names match the search query if not already in the list
    items.push(
      ...existingGroupsByGroupName
        .filter(
          (xmtpConversationId) =>
            !items.some(
              (item) => item.type === "group" && item.xmtpConversationId === xmtpConversationId,
            ),
        )
        .map((xmtpConversationId) => ({
          type: "group" as const,
          xmtpConversationId,
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
        return !addedDms.some(({ xmtpConversationId }) => {
          return inboxIdIsPartOfConversationUsingCacheData({
            inboxId,
            xmtpConversationId,
          })
        })
      })

    items.push(...(profilesNotInDms ?? []))

    // 5. Add raw Ethereum address if the search query is an Ethereum address
    // and we don't have any Convos users
    if (isEthereumAddress(searchTextValue) && searchConvosUsersData?.length === 0) {
      items.push({
        type: "external_identity" as const,
        address: searchTextValue,
      })
    }

    // 6. Add ENS, Base, or Unstoppable domains if resolved
    if (ensEthAddressResolution) {
      items.push({
        type: "external_identity" as const,
        address: ensEthAddressResolution,
      })
    }
    if (baseEthAddressResolution) {
      items.push({
        type: "external_identity" as const,
        address: baseEthAddressResolution,
      })
    }
    if (unstoppableDomainEthAddressResolution) {
      items.push({
        type: "external_identity" as const,
        address: unstoppableDomainEthAddressResolution,
      })
    }

    return items
  }, [
    existingDm,
    existingGroupsByMemberName,
    existingGroupsByGroupName,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
    searchTextValue,
    ensEthAddressResolution,
    baseEthAddressResolution,
    unstoppableDomainEthAddressResolution,
  ])

  const isStillLoadingSearchResults =
    isLoadingExistingDm ||
    isLoadingExistingGroupsByName ||
    isLoadingExistingGroupsByMembers ||
    isSearchingConvosUsers

  const renderItem: ListRenderItem<SearchResultItem> = ({ item }) => {
    if (searchResultIsDm(item)) {
      return (
        <SearchUsersResultsListItemUserDmWrapper xmtpConversationId={item.xmtpConversationId} />
      )
    }
    if (searchResultIsGroup(item)) {
      return <SearchUsersResultsListItemGroupWrapper xmtpConversationId={item.xmtpConversationId} />
    }
    if (searchResultIsProfile(item)) {
      return <SearchUsersResultsListItemUserWrapper inboxId={item.inboxId} />
    }
    if (searchResultIsExternalIdentity(item)) {
      return <SearchUsersResultsListItemExternalIdentityWrapper externalIdentity={item} />
    }
    const _ensureNever: never = item
    return null
  }

  const keyExtractor = (item: SearchResultItem, index: number) => {
    if (searchResultIsDm(item)) {
      return `dm-${item.xmtpConversationId}`
    }
    if (searchResultIsGroup(item)) {
      return `group-${item.xmtpConversationId}`
    }
    if (searchResultIsProfile(item)) {
      return `profile-${item.inboxId}`
    }
    if (searchResultIsExternalIdentity(item)) {
      return `external-identity-${item.address}`
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
  const { keyboardHeightAV } = useAnimatedKeyboard()

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
