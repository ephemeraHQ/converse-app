import { memo, useCallback, useMemo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { SearchUsersResultsList } from "@/features/search-users/search-users-results-list"
import { useSearchConvosUsersQuery } from "@/features/search-users/use-search-convos-users"
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { isEthereumAddress } from "@/utils/evm/address"
import {
  searchResultIsEthAddress,
  searchResultIsProfile,
  searchResultIsSocialProfile,
  SearchResultItem,
} from "../add-group-members.types"
import { useAddGroupMembersStore } from "../stores/add-group-members.store"
import { AddGroupMembersSearchUsersResultsListItemEthAddress } from "./add-group-members-search-users-results-list-item-eth-address.component"
import { AddGroupMembersSearchUsersResultsListItemNoConvosUser } from "./add-group-members-search-users-results-list-item-no-convos-user.component"
import { AddGroupMembersSearchUsersResultsListItemUser } from "./add-group-members-search-users-results-list-item-user-.component"

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

    const {
      data: socialProfilesForEthAddress = [],
      isLoading: isLoadingSocialProfilesForEthAddress,
    } = useSocialProfilesForAddressQuery({
      ethAddress: searchQuery,
    })

    const isEthAddress = useMemo(() => {
      return isEthereumAddress(searchQuery)
    }, [searchQuery])

    const listData = useMemo(() => {
      const items: SearchResultItem[] = []

      if (!searchQuery) {
        return items
      }

      // 1. Add user profiles
      const profiles = searchConvosUsersData?.map((profile) => ({
        type: "profile" as const,
        inboxId: profile.xmtpId,
      }))

      items.push(...(profiles ?? []))

      // 2. Add social profiles only if we don't have any conversation users
      if (searchConvosUsersData?.length === 0 && socialProfilesForEthAddress.length > 0) {
        items.push(
          ...socialProfilesForEthAddress.map((profile) => ({
            type: "socialProfile" as const,
            profile,
          })),
        )
      }

      // 3. Add raw Ethereum address if:
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
        })
      }

      return items
    }, [searchConvosUsersData, socialProfilesForEthAddress, searchQuery, isEthAddress])

    const isStillLoadingSearchResults =
      isSearchingConvosUsers || isLoadingSocialProfilesForEthAddress

    const renderItem = useCallback(({ item }: { item: SearchResultItem }) => {
      if (searchResultIsProfile(item)) {
        return <AddGroupMembersSearchUsersResultsListItemUser inboxId={item.inboxId} />
      }
      if (searchResultIsSocialProfile(item)) {
        return (
          <AddGroupMembersSearchUsersResultsListItemNoConvosUser socialProfile={item.profile} />
        )
      }
      if (searchResultIsEthAddress(item)) {
        return <AddGroupMembersSearchUsersResultsListItemEthAddress ethAddress={item.address} />
      }
      const _ensureNever: never = item
      return null
    }, [])

    const keyExtractor = useCallback((item: SearchResultItem): string => {
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
