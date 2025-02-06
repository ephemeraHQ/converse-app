import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { userSearchQueryKey } from "@/queries/QueryKeys";
import { searchProfilesForCurrentAccount } from "@/utils/api/profiles";
import { getAddressForPeer, isSupportedPeer } from "@/utils/evm/address";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { isEmptyObject } from "@/utils/objects";
import { shortAddress } from "@/utils/strings/shortAddress";
import {
  getInboxIdFromAddress,
  isSameInboxId,
} from "@/utils/xmtpRN/xmtp-inbox-id/xmtp-inbox-id";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";

export function useSearchConvosUsers(args: {
  searchQuery: string;
  inboxIdsToOmit: string[];
}) {
  const { searchQuery, inboxIdsToOmit } = args;

  return useQuery({
    ...getConvosUsersSearchQueryOptions(searchQuery),
    select: (data) => {
      // Filter out search results for addresses that should be omitted (e.g. current user and selected users)
      const filteredResults = {
        ...data,
        inboxIds: data?.inboxIds?.filter(
          (inboxId) =>
            !inboxId ||
            !inboxIdsToOmit.some((inboxIdToOmit) =>
              isSameInboxId(inboxId, inboxIdToOmit)
            )
        ),
      };

      return filteredResults;
    },
  });
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

async function searchConvosUsers({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<{ message: string; inboxIds: InboxId[] }> {
  if (searchQuery.length === 0) {
    return {
      message: "",
      inboxIds: [],
    };
  }

  if (isSupportedPeer(searchQuery)) {
    return handlePeerSearch(searchQuery);
  }

  return handleGeneralSearch(searchQuery);
}

async function handlePeerSearch(searchQuery: string) {
  const resolvedAddress = await getAddressForPeer(searchQuery);

  if (!resolvedAddress) {
    return {
      inboxIds: [],
      message: "No address has been set for this domain.",
    };
  }

  const address = getCleanAddress(resolvedAddress);

  const inboxId = await getInboxIdFromAddress({
    currentUserAddress: getCurrentAccount()!,
    targetEthAddress: address,
  });

  if (!inboxId) {
    return {
      message: `${shortAddress(searchQuery)} is not on the XMTP network yet`,
      inboxIds: [],
    };
  }

  return {
    message: "",
    inboxIds: [inboxId],
  };
}

async function handleGeneralSearch(searchQuery: string) {
  const profiles = await searchProfilesForCurrentAccount(searchQuery);

  if (isEmptyObject(profiles)) {
    return {
      message: "No matches found.\nWould you like to invite them?",
      inboxIds: [],
    };
  }

  const inboxIds = (
    await Promise.all(
      Object.keys(profiles).map((address) =>
        getInboxIdFromAddress({
          currentUserAddress: getCurrentAccount()!,
          targetEthAddress: address,
        })
      )
    )
  ).filter(Boolean);

  return {
    message: "",
    inboxIds: inboxIds,
  };
}
