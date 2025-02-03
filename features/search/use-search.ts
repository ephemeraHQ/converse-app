import { useSearchByConversationMembershipQuery } from "./search-by-conversation-membership/use-search-by-conversation-membership.query";
import { useSearchConvosUsersQuery } from "./use-search-convos-users-query";

export const useSearch = (args: {
  searchQuery: string;
  addressesToOmit: string[];
}) => {
  const { searchQuery, addressesToOmit } = args;

  const { convosSearchResults, message, areSearchResultsLoading } =
    useSearchConvosUsersQuery({ searchQuery, addressesToOmit });

  const { data, isLoading: isConversationMembershipLoading } =
    useSearchByConversationMembershipQuery(searchQuery);

  return {
    convosUsersSearchResults: {
      users: convosSearchResults,
      message,
    },
    existingConversationMembershipSearchResults: data,
    areSearchResultsLoading:
      isConversationMembershipLoading || areSearchResultsLoading,
  };
};
