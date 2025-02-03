import { getCurrentAccount } from "@/data/store/accountsStore";
import { accountCanMessagePeer } from "@/features/consent/account-can-message-peer";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { userSearchQueryKey } from "@/queries/QueryKeys";
import { setProfileRecordSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { searchProfilesForCurrentAccount } from "@/utils/api/profiles";
import { getAddressForPeer, isSupportedPeer } from "@/utils/evm/address";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { isEmptyObject } from "@/utils/objects";
import { shortAddress } from "@/utils/strings/shortAddress";
import { queryOptions, useQuery } from "@tanstack/react-query";

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
    select: (data) => {
      // Filter out search results for addresses that should be omitted (e.g. current user and selected users)
      const filteredResults = {
        ...data,
        convosSearchResults: data?.convosSearchResults?.filter(
          (result) =>
            !result.address ||
            !allAddressesToOmit.includes(result.address.toLowerCase())
        ),
      };

      return filteredResults;
    },
  });

  return {
    convosSearchResults: data?.convosSearchResults,
    message: data?.message,
    areSearchResultsLoading,
  };
}

function getConvosUsersSearchQueryOptions(searchQuery: string) {
  // logger.info(`[Search] Creating query options for search: ${searchQuery}`);
  return queryOptions({
    queryKey: userSearchQueryKey(searchQuery),
    queryFn: () => searchConvosUsers({ searchQuery }),
    enabled: !!searchQuery,
    staleTime: 1000 * 10, // We often want to make sure we're looking if there are new users for our search query,
  });
}

/**
 * Users our backend to search for users in the Convo network
 *
 * @see we also have methods for searching for users by current conversation cached locally
 */
async function searchConvosUsers({ searchQuery }: { searchQuery: string }) {
  if (searchQuery.length === 0) {
    return {
      message: "",
      convosSearchResults: [],
    };
  }

  if (isSupportedPeer(searchQuery)) {
    return handlePeerSearch(searchQuery);
  }

  return handleGeneralSearch(searchQuery);
}

/**
 * Handles searching when searchQuery is a supported domain/ENS
 */
async function handlePeerSearch(searchQuery: string) {
  // logger.info(`[Search] Starting peer search for query: ${searchQuery}`);
  // logger.info(`[Search] Query ${searchQuery} is a supported peer format`);
  const resolvedAddress = await getAddressForPeer(searchQuery);

  if (!resolvedAddress) {
    // logger.info(`[Search] No address resolved for ${searchQuery}`);
    return {
      convosSearchResults: [],
      message: "No address has been set for this domain.",
    };
  }

  const address = getCleanAddress(resolvedAddress);
  // logger.info(`[Search] Resolved address ${address} for ${searchQuery}`);
  // logger.info(`[Search] Checking if ${address} is on XMTP`);
  const addressIsOnXmtp = await accountCanMessagePeer({
    account: getCurrentAccount()!,
    peer: address,
  });

  if (!addressIsOnXmtp) {
    // logger.info(`[Search] ${address} is not on XMTP`);
    return {
      message: `${shortAddress(searchQuery)} is not on the XMTP network yet`,
      convosSearchResults: [],
    };
  }

  // logger.info(`[Search] ${address} is on XMTP, fetching profiles`);
  const profiles = await searchProfilesForCurrentAccount(address);
  // logger.info(`[Search] Profiles fetched:`, JSON.stringify(profiles, null, 2));
  if (!isEmptyObject(profiles)) {
    // logger.info(`[Search] Found profiles for ${address}, setting profile data`);
    setProfileRecordSocialsQueryData(profiles);
    return {
      message: "",
      convosSearchResults: Object.values(profiles),
    };
  }

  // logger.info(
  //   `[Search] No profiles found for ${address}, returning just address`
  // );
  const justAddress: Array<IProfileSocials> = [{ address }];
  return {
    message: "address is on xmtp but not on converse yet",
    convosSearchResults: justAddress,
  };
}

/**
 * Handles searching when searchQuery is a regular string (not a peer)
 */
async function handleGeneralSearch(searchQuery: string) {
  // logger.info(`[Search] Starting general search for query: ${searchQuery}`);
  // logger.info(`[Search] Searching profiles for query: ${searchQuery}`);
  const profiles = await searchProfilesForCurrentAccount(searchQuery);
  // logger.info(`[Search] Profiles found:`, JSON.stringify(profiles, null, 2));
  if (!isEmptyObject(profiles)) {
    // logger.info(`[Search] Found profiles for query ${searchQuery}`);
    setProfileRecordSocialsQueryData(profiles);
    const filteredProfiles = Object.values(profiles);
    // logger.info(
    //   `[Search] Filtered profiles:`,
    //   JSON.stringify(filteredProfiles, null, 2)
    // );
    return {
      message: "",
      convosSearchResults: filteredProfiles,
    };
  }

  // logger.info(`[Search] No profiles found for query ${searchQuery}`);
  return {
    message: `They're not here\nInvite them?`,
    convosSearchResults: [],
  };
}
