import { searchByConversationMembershipQueryKey } from "@/queries/QueryKeys";
import { queryOptions } from "@tanstack/react-query";
import { searchByConversationMembership } from "./search-conversations";

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
