import { queryOptions, useQuery } from "@tanstack/react-query";
import logger from "@/utils/logger";
import { searchByConversationMembership } from "./search-by-conversation-membership";
import { searchByConversationMembershipQueryKey } from "@/queries/QueryKeys";

export function getSearchByConversationMembershipQueryOptions(
  searchQuery: string
) {
  logger.info(
    `[Search] Creating conversation membership query options for: ${searchQuery}`
  );
  return queryOptions({
    queryKey: searchByConversationMembershipQueryKey(searchQuery),
    queryFn: () => searchByConversationMembership({ searchQuery }),
    enabled: !!searchQuery,
    staleTime: 0,
  });
}

export function useSearchByConversationMembershipQuery(searchQuery: string) {
  const { data } = useQuery(
    getSearchByConversationMembershipQueryOptions(searchQuery)
  );

  return {
    existingDmSearchResults: data?.existingDmSearchResults,
    existingGroupMemberNameSearchResults:
      data?.existingGroupMemberNameSearchResults,
    existingGroupNameSearchResults: data?.existingGroupNameSearchResults,
  };
}
