import { queryOptions, useQuery } from "@tanstack/react-query";

import { IProfileSocials } from "@/features/profiles/profile-types";
import { userSearchQueryKey } from "./QueryKeys";

type ISearchArgs = {
  searchQuery: string;
  addressesToOmit: string[];
};

type ISearchResult = {
  message: string;
  profileSearchResults: Record<string, IProfileSocials>;
};

import { currentAccount, getCurrentAccount } from "@/data/store/accountsStore";
import { getAddressForPeer, isSupportedPeer } from "@/utils/evm/address";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { searchProfilesForCurrentAccount } from "@/utils/api/profiles";
import { setProfileRecordSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { isEmptyObject } from "@/utils/objects";
import { shortAddress } from "@/utils/strings/shortAddress";
import { accountCanMessagePeer } from "@/features/consent/account-can-message-peer";
import logger from "@/utils/logger";

/**
 * Pure function to search for users by query
 */
export async function searchUsers({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<ISearchResult> {
  logger.info(`[Search] Starting search for query: ${searchQuery}`);

  if (searchQuery.length === 0) {
    logger.info("[Search] Empty search query, returning empty results");
    return {
      message: "",
      profileSearchResults: {},
    };
  }

  if (isSupportedPeer(searchQuery)) {
    logger.info(`[Search] Query ${searchQuery} is a supported peer format`);
    const resolvedAddress = await getAddressForPeer(searchQuery);

    if (!resolvedAddress) {
      logger.info(`[Search] No address resolved for ${searchQuery}`);
      return {
        profileSearchResults: {},
        message: "No address has been set for this domain.",
      };
    }

    logger.info(
      `[Search] Resolved address ${resolvedAddress} for ${searchQuery}`
    );
    const address = getCleanAddress(resolvedAddress);
    logger.info(`[Search] Checking if ${address} is on XMTP`);

    const addressIsOnXmtp = await accountCanMessagePeer({
      account: currentAccount(),
      peer: address,
    });

    if (addressIsOnXmtp) {
      logger.info(`[Search] ${address} is on XMTP, fetching profiles`);
      const profiles = await searchProfilesForCurrentAccount(address);

      if (!isEmptyObject(profiles)) {
        logger.info(
          `[Search] Found profiles for ${address}, setting profile data`
        );
        setProfileRecordSocialsQueryData(profiles);
        return {
          message: "",
          profileSearchResults: profiles,
        };
      } else {
        logger.info(
          `[Search] No profiles found for ${address}, returning just address`
        );
        const justAddress: Record<string, IProfileSocials> = {
          [address]: { address },
        };
        return {
          message: "address is on xmtp but not on converse yet ;)",
          profileSearchResults: justAddress,
        };
      }
    } else {
      logger.info(`[Search] ${address} is not on XMTP`);
      return {
        message: `${shortAddress(
          searchQuery
        )} is not on the XMTP network yet 😏`,
        profileSearchResults: {},
      };
    }
  } else {
    logger.info(`[Search] Searching profiles for query: ${searchQuery}`);
    const profiles = await searchProfilesForCurrentAccount(searchQuery);

    if (!isEmptyObject(profiles)) {
      logger.info(`[Search] Found profiles for query ${searchQuery}`);
      setProfileRecordSocialsQueryData(profiles);
      const filteredProfiles = { ...profiles };
      return {
        message: "",
        profileSearchResults: filteredProfiles,
      };
    } else {
      logger.info(`[Search] No profiles found for query ${searchQuery}`);
      return {
        message: `No profiles found for ${searchQuery}`,
        profileSearchResults: {},
      };
    }
  }
}

const SearchResultStaleTime = 1000 * 60 * 5; // 5 minutes
export function getSearchQueryOptions(searchQuery: string) {
  return queryOptions({
    queryKey: userSearchQueryKey(searchQuery),
    queryFn: () => searchUsers({ searchQuery }),
    enabled: !!searchQuery,
    staleTime: SearchResultStaleTime,
  });
}

export const useSearchQuery = (args: ISearchArgs) => {
  const { searchQuery } = args;
  const {
    data: { profileSearchResults, message } = {},
    isLoading: areSearchResultsLoading,
  } = useQuery(getSearchQueryOptions(searchQuery));
  const currentAccount = getCurrentAccount()!;
  const currentAccountAddress = getCleanAddress(currentAccount);
  const allAddressesToOmit = [...args.addressesToOmit, currentAccountAddress];

  for (const address of allAddressesToOmit) {
    if (profileSearchResults && profileSearchResults[address]) {
      delete profileSearchResults[address];
    }
  }

  return {
    profileSearchResults,
    message,
    hasSearchResults:
      profileSearchResults != undefined && !isEmptyObject(profileSearchResults),
    areSearchResultsLoading,
  };
};
