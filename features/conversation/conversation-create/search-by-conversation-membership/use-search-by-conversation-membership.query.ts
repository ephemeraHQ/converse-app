import { searchByConversationMembershipQueryKey } from "@/queries/QueryKeys";
import { queryOptions } from "@tanstack/react-query";
import { searchByConversationMembership } from "./utils/search-by-conversation-membership";

export function getSearchByConversationMembershipQueryOptions(args: {
  searchQuery: string;
}) {
  return queryOptions({
    queryKey: searchByConversationMembershipQueryKey(args),
    queryFn: () => searchByConversationMembership(args),
    enabled: !!args.searchQuery,
    staleTime: 0,
  });
}
