import { IProfileSocials } from "@/features/profiles/profile-types";

import { getCurrentAccount } from "@/data/store/accountsStore";
import { getAddressForPeer, isSupportedPeer } from "@/utils/evm/address";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { searchProfilesForCurrentAccount } from "@/utils/api/profiles";
import { setProfileRecordSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { isEmptyObject } from "@/utils/objects";
import { shortAddress } from "@/utils/strings/shortAddress";
import { accountCanMessagePeer } from "@/features/consent/account-can-message-peer";
import logger from "@/utils/logger";
import { IConvosUsersSearchResult } from "../search.types";
/**
 * Handles searching when searchQuery is a supported domain/ENS
 */
async function handlePeerSearch(
  searchQuery: string
): Promise<IConvosUsersSearchResult> {
  logger.info(`[Search] Starting peer search for query: ${searchQuery}`);
  logger.info(`[Search] Query ${searchQuery} is a supported peer format`);
  const resolvedAddress = await getAddressForPeer(searchQuery);

  if (!resolvedAddress) {
    logger.info(`[Search] No address resolved for ${searchQuery}`);
    return {
      convosSearchResults: [],
      message: "No address has been set for this domain.",
    };
  }

  const address = getCleanAddress(resolvedAddress);
  logger.info(`[Search] Resolved address ${address} for ${searchQuery}`);
  logger.info(`[Search] Checking if ${address} is on XMTP`);

  const addressIsOnXmtp = await accountCanMessagePeer({
    account: getCurrentAccount()!,
    peer: address,
  });

  if (!addressIsOnXmtp) {
    logger.info(`[Search] ${address} is not on XMTP`);
    return {
      message: `${shortAddress(searchQuery)} is not on the XMTP network yet`,
      convosSearchResults: [],
    };
  }

  logger.info(`[Search] ${address} is on XMTP, fetching profiles`);
  const profiles = await searchProfilesForCurrentAccount(address);
  logger.info(`[Search] Profiles fetched:`, JSON.stringify(profiles, null, 2));

  if (!isEmptyObject(profiles)) {
    logger.info(`[Search] Found profiles for ${address}, setting profile data`);
    setProfileRecordSocialsQueryData(profiles);
    return {
      message: "",
      convosSearchResults: Object.values(profiles),
    };
  }

  logger.info(
    `[Search] No profiles found for ${address}, returning just address`
  );
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
  logger.info(`[Search] Starting general search for query: ${searchQuery}`);
  logger.info(`[Search] Searching profiles for query: ${searchQuery}`);
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

/**
 * Users our backend to search for users in the Convo network
 *
 * @see we also have methods for searching for users by current conversation cached locally
 */
export async function searchConvosUsers({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<IConvosUsersSearchResult> {
  // logger.info(`[Search] Starting search for query: ${searchQuery}`);

  if (searchQuery.length === 0) {
    // logger.info(`[Search] Empty search query, returning empty results`);
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
