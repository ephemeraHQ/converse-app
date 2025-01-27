import { queryOptions, useQuery } from "@tanstack/react-query";
import { getCurrentAccount } from "@/data/store/accountsStore";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import logger from "@/utils/logger";
import { userSearchQueryKey } from "@/queries/QueryKeys";
import { searchConvosUsers } from "./search-convos-profiles";
import type { IUserSearchResults } from "../search.types";

const SearchResultStaleTime = 1000 * 10; // 10 seconds

export function getConvosUsersSearchQueryOptions(searchQuery: string) {
  logger.info(`[Search] Creating query options for search: ${searchQuery}`);
  return queryOptions({
    queryKey: userSearchQueryKey(searchQuery),
    queryFn: () => searchConvosUsers({ searchQuery }),
    enabled: !!searchQuery,
    staleTime: SearchResultStaleTime,
  });
}

export function useSearchConvosUsersQuery(args: {
  searchQuery: string;
  addressesToOmit: string[];
}) {
  const { searchQuery, addressesToOmit } = args;
  const currentAccount = getCurrentAccount()!;
  const currentAccountAddress = getCleanAddress(currentAccount);
  const allAddressesToOmit = [...addressesToOmit, currentAccountAddress].map(
    (address) => address.toLowerCase()
  );

  const { data, isLoading: areSearchResultsLoading } = useQuery({
    ...getConvosUsersSearchQueryOptions(searchQuery),
    select: (data: IUserSearchResults) => {
      const filteredResults = { ...data };
      if (filteredResults.convosSearchResults) {
        filteredResults.convosSearchResults =
          filteredResults.convosSearchResults.filter((result) => {
            if (
              result.address &&
              allAddressesToOmit.includes(result.address.toLowerCase())
            ) {
              logger.info(
                `[Search] Omitting address from results: ${result.address}`
              );
              return false;
            }
            return true;
          });
      }
      return filteredResults;
    },
  });

  return {
    convosSearchResults: data?.convosSearchResults,
    message: data?.message,
    areSearchResultsLoading,
  };
}
