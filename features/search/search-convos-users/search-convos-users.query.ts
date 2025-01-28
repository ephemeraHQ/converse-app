import { useSearchByConversationMembershipQuery } from "../search-by-conversation-membership/use-search-by-conversation-membership.query";
import { useSearchConvosUsersQuery } from "./use-search-convos-users.query";
import type { IUserSearchResults } from "../search.types";

export const useSearchUsersQuery = (args: {
  searchQuery: string;
  addressesToOmit: string[];
}) => {
  const { searchQuery, addressesToOmit } = args;

  const { convosSearchResults, message, areSearchResultsLoading } =
    useSearchConvosUsersQuery({ searchQuery, addressesToOmit });

  const {
    existingDmSearchResults,
    existingGroupMemberNameSearchResults,
    existingGroupNameSearchResults,
  } = useSearchByConversationMembershipQuery(searchQuery);

  const searchResults: IUserSearchResults = {
    existingDmSearchResults,
    existingGroupMemberNameSearchResults,
    existingGroupNameSearchResults,
    convosSearchResults,
    message,
  };
  // logger.info(
  //   `[Search] Search results:`,
  //   JSON.stringify(searchResults, null, 2)
  // );

  return {
    searchResults,
    hasSearchResults: true,
    areSearchResultsLoading,
  };
};
