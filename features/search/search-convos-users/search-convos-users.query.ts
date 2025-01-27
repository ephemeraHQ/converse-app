import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  searchByConversationMembershipQueryKey,
  userSearchQueryKey,
} from "../../../queries/QueryKeys";

type ISearchArgs = {
  searchQuery: string;
  addressesToOmit: string[];
};

import { getCurrentAccount } from "@/data/store/accountsStore";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import logger from "@/utils/logger";
import { searchByConversationMembership } from "../search-by-conversation-membership/search-by-conversation-membership";
import { IUserSearchResults } from "../search.types";
import { searchConvosUsers } from "./search-convos-profiles";

const SearchResultStaleTime = 1000 * 10; // 10 seconds

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
    // staleTime: SearchResultStaleTime,
    staleTime: 0,
  });
}
export function getConvosUsersSearchQueryOptions(searchQuery: string) {
  logger.info(`[Search] Creating query options for search: ${searchQuery}`);
  return queryOptions({
    queryKey: userSearchQueryKey(searchQuery),
    queryFn: () => searchConvosUsers({ searchQuery }),
    enabled: !!searchQuery,
    staleTime: SearchResultStaleTime,
  });
}

export const useSearchUsersQuery = (args: ISearchArgs) => {
  const { searchQuery } = args;
  const currentAccount = getCurrentAccount()!;
  const currentAccountAddress = getCleanAddress(currentAccount);
  const allAddressesToOmit = [
    ...args.addressesToOmit,
    currentAccountAddress,
  ].map((address) => address.toLowerCase());

  logger.info(
    `[Search] Starting search query with args:`,
    JSON.stringify(args, null, 2)
  );
  logger.info(
    `[Search] Addresses to omit:`,
    JSON.stringify(allAddressesToOmit, null, 2)
  );

  const {
    data: { convosSearchResults, message } = {},
    isLoading: areSearchResultsLoading,
  } = useQuery({
    ...getConvosUsersSearchQueryOptions(searchQuery),
    select: (data) => {
      const filteredResults = { ...data };
      if (filteredResults.convosSearchResults) {
        Object.keys(filteredResults.convosSearchResults).forEach((address) => {
          if (allAddressesToOmit.includes(address.toLowerCase())) {
            logger.info(`[Search] Omitting address from results: ${address}`);
            delete filteredResults.convosSearchResults?.[address];
          }
        });
      }

      return filteredResults;
    },
  });

  const {
    data: {
      existingDmSearchResults,
      existingGroupMemberNameSearchResults,
      existingGroupNameSearchResults,
    } = {},
  } = useQuery(getSearchByConversationMembershipQueryOptions(searchQuery));

  const searchResults: IUserSearchResults = {
    existingDmSearchResults,
    existingGroupMemberNameSearchResults,
    existingGroupNameSearchResults,
    convosSearchResults,
    message,
  };

  logger.info(
    `[Search] Final combined search results:`,
    JSON.stringify(
      { ...searchResults, convosSearchResults: undefined },
      null,
      2
    )
  );

  return {
    searchResults,
    hasSearchResults: true,
    areSearchResultsLoading,
  };
};
