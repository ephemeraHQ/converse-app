import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { memo, useCallback, useMemo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useSearchConvosUsersQuery } from "@/features/search-users/queries/search-convos-users.query"
import { SearchUsersResultsList } from "@/features/search-users/search-users-results-list"
import {
  useBaseNameResolution,
  useEnsNameResolution,
  useUnstoppableDomainNameResolution,
} from "@/features/social-profiles/identity-resolution.query"
import { IEthereumAddress, isEthereumAddress } from "@/utils/evm/address"
import { useAddGroupMembersStore } from "../stores/add-group-members.store"
import { AddGroupMembersSearchUsersResultsListItemEthAddress } from "./add-group-members-search-users-results-list-item-eth-address.component"
import { AddGroupMembersSearchUsersResultsListItemUser } from "./add-group-members-search-users-results-list-item-user-.component"

type ISearchResultItemConvosProfile = {
  type: "profile"
  inboxId: IXmtpInboxId
}

type ISearchResultItemExternalIdentity = {
  type: "externalIdentity"
  address: IEthereumAddress
}

type SearchResultItem = ISearchResultItemConvosProfile | ISearchResultItemExternalIdentity

function searchResultIsConvosProfile(
  item: SearchResultItem,
): item is ISearchResultItemConvosProfile {
  return item.type === "profile"
}

function searchResultIsExternalIdentity(
  item: SearchResultItem,
): item is ISearchResultItemExternalIdentity {
  return item.type === "externalIdentity"
}

export const AddGroupMembersSearchUsersResultsList = memo(
  function AddGroupMembersSearchUsersResultsList() {
    const searchQuery = useAddGroupMembersStore((state) => state.searchQuery)
    const selectedInboxIds = useAddGroupMembersStore((state) => state.selectedInboxIds)
    const currentUserInboxId = useSafeCurrentSender().inboxId

    const { data: searchConvosUsersData, isLoading: isSearchingConvosUsers } =
      useSearchConvosUsersQuery({
        searchQuery,
        inboxIdsToOmit: [...selectedInboxIds, currentUserInboxId],
      })

    const { data: ensEthAddressResolution, isLoading: isEnsNameResolutionLoading } =
      useEnsNameResolution(searchQuery)
    const { data: baseEthAddressResolution, isLoading: isBaseNameResolutionLoading } =
      useBaseNameResolution(searchQuery)
    const {
      data: unstoppableDomainEthAddressResolution,
      isLoading: isUnstoppableDomainResolutionLoading,
    } = useUnstoppableDomainNameResolution(searchQuery)

    const listData = useMemo(() => {
      const items: SearchResultItem[] = []

      if (!searchQuery) {
        return items
      }

      // 1. Add user profiles
      const convosProfiles = searchConvosUsersData?.map((profile) => ({
        type: "profile" as const,
        inboxId: profile.xmtpId,
      }))

      items.push(...(convosProfiles ?? []))

      // 2. Add raw Ethereum address
      if (isEthereumAddress(searchQuery)) {
        items.push({
          type: "externalIdentity",
          address: searchQuery as IEthereumAddress,
        })
      }

      // 3. Add ENS, Base, or Unstoppable domains if resolved
      if (ensEthAddressResolution) {
        items.push({
          type: "externalIdentity",
          address: ensEthAddressResolution,
        })
      }
      if (baseEthAddressResolution) {
        items.push({
          type: "externalIdentity",
          address: baseEthAddressResolution,
        })
      }
      if (unstoppableDomainEthAddressResolution) {
        items.push({
          type: "externalIdentity",
          address: unstoppableDomainEthAddressResolution,
        })
      }

      return items
    }, [
      searchConvosUsersData,
      searchQuery,
      ensEthAddressResolution,
      baseEthAddressResolution,
      unstoppableDomainEthAddressResolution,
    ])

    const isStillLoadingSearchResults =
      isSearchingConvosUsers ||
      isEnsNameResolutionLoading ||
      isBaseNameResolutionLoading ||
      isUnstoppableDomainResolutionLoading

    const renderItem = useCallback(({ item }: { item: SearchResultItem }) => {
      if (searchResultIsConvosProfile(item)) {
        return <AddGroupMembersSearchUsersResultsListItemUser inboxId={item.inboxId} />
      }
      if (searchResultIsExternalIdentity(item)) {
        return <AddGroupMembersSearchUsersResultsListItemEthAddress ethAddress={item.address} />
      }
      const _ensureNever: never = item
      return null
    }, [])

    const keyExtractor = useCallback((item: SearchResultItem): string => {
      if (searchResultIsConvosProfile(item)) {
        return `profile-${item.inboxId}`
      }
      if (searchResultIsExternalIdentity(item)) {
        return `external-identity-${item.address}`
      }
      const _ensureNever: never = item
      throw new Error("Invalid item type")
    }, [])

    return (
      <SearchUsersResultsList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        isLoading={isStillLoadingSearchResults}
        searchText={searchQuery}
      />
    )
  },
)
