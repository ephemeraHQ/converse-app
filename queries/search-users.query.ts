import { queryOptions, useQuery } from "@tanstack/react-query";

import { IProfileSocials } from "@/features/profiles/profile-types";
import {
  searchByConversationMembershipQueryKey,
  userSearchQueryKey,
} from "./QueryKeys";

type ISearchArgs = {
  searchQuery: string;
  addressesToOmit: string[];
};

import { getCurrentAccount } from "@/data/store/accountsStore";
import { getAddressForPeer, isSupportedPeer } from "@/utils/evm/address";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { searchProfilesForCurrentAccount } from "@/utils/api/profiles";
import {
  getProfileSocialsQueryData,
  setProfileRecordSocialsQueryData,
} from "@/queries/useProfileSocialsQuery";
import { isEmptyObject } from "@/utils/objects";
import { shortAddress } from "@/utils/strings/shortAddress";
import { accountCanMessagePeer } from "@/features/consent/account-can-message-peer";
import logger from "@/utils/logger";
import { getConversationsQueryData } from "./use-conversations-query";
import { ensureGroupMembersQueryData } from "./useGroupMembersQuery";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import { getPreferredName } from "@/utils/profile";
import { getReadableProfile } from "@/utils/getReadableProfile";

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
      convosSearchResults: {},
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
      convosSearchResults: {},
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
      convosSearchResults: profiles,
    };
  }

  logger.info(
    `[Search] No profiles found for ${address}, returning just address`
  );
  const justAddress: Record<string, IProfileSocials> = {
    [address]: { address },
  };
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
  logger.info(`[Search] Profiles found:`, JSON.stringify(profiles, null, 2));

  if (!isEmptyObject(profiles)) {
    logger.info(`[Search] Found profiles for query ${searchQuery}`);
    setProfileRecordSocialsQueryData(profiles);
    const filteredProfiles = { ...profiles };
    logger.info(
      `[Search] Filtered profiles:`,
      JSON.stringify(filteredProfiles, null, 2)
    );
    return {
      message: "",
      convosSearchResults: filteredProfiles,
    };
  }

  logger.info(`[Search] No profiles found for query ${searchQuery}`);
  return {
    message: `They're not here\nInvite them?`,
    convosSearchResults: {},
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
  logger.info(`[Search] Starting search for query: ${searchQuery}`);

  if (searchQuery.length === 0) {
    logger.info(`[Search] Empty search query, returning empty results`);
    return {
      message: "",
      convosSearchResults: {},
    };
  }

  if (isSupportedPeer(searchQuery)) {
    return handlePeerSearch(searchQuery);
  }

  return handleGeneralSearch(searchQuery);
}

const SearchResultStaleTime = 1000 * 10; // 10 seconds

type GroupNameSearchResult = {
  groupName: string;
  groupId: string;
  groupImageUri: string;
  firstThreeMemberNames: string[];
};

type GroupMemberNameSearchResult = GroupNameSearchResult & {
  memberNameFromGroup: string;
};

export type IUserSearchResults = IConvosUsersSearchResult &
  IConversationMembershipSearchResult;

export type IConvosUsersSearchResult = {
  convosSearchResults?: Record<string, IProfileSocials>;
  message?: string;
};

export function getConvosUsersSearchQueryOptions(searchQuery: string) {
  logger.info(`[Search] Creating query options for search: ${searchQuery}`);
  return queryOptions({
    queryKey: userSearchQueryKey(searchQuery),
    queryFn: () => searchConvosUsers({ searchQuery }),
    enabled: !!searchQuery,
    staleTime: SearchResultStaleTime,
  });
}

export type IConversationMembershipSearchResult = {
  existingDmSearchResults?: Record<string, IProfileSocials>;
  existingGroupMemberNameSearchResults?: GroupMemberNameSearchResult[];
  existingGroupNameSearchResults?: GroupNameSearchResult[];
};

async function searchByConversationMembership({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<IConversationMembershipSearchResult> {
  logger.info(
    `[Search] Starting conversation membership search for: ${searchQuery}`
  );

  const allConversations = await getConversationsQueryData({
    account: getCurrentAccount()!,
  });
  logger.info(
    `[Search] All conversations:`,
    JSON.stringify(allConversations, null, 2)
  );

  if (!allConversations) {
    logger.info(`[Search] No conversations found, returning empty results`);
    return {
      existingDmSearchResults: {},
      existingGroupMemberNameSearchResults: [],
      existingGroupNameSearchResults: [],
    };
  }

  logger.info(`[Search] Processing ${allConversations.length} conversations`);
  const allConversationsWithMemberIds = await Promise.all(
    allConversations.map(async (c) => {
      const isGroup = isConversationGroup(c);
      const isDm = isConversationDm(c);
      let conversationName, conversationImageUri;
      if (isGroup) {
        conversationName = c.name;
        conversationImageUri = c.imageUrlSquare;
      } else if (isDm) {
        conversationName = c.topic;
      }

      logger.info(`[Search] Getting members for conversation: ${c.topic}`);
      const allGroupMembers = await ensureGroupMembersQueryData({
        account: getCurrentAccount()!,
        topic: c.topic,
      });

      const result = {
        ...c,
        memberAddresses: allGroupMembers.addresses,
        conversationName,
        conversationImageUri,
      };
      logger.info(
        `[Search] Conversation with members:`,
        JSON.stringify(result, null, 2)
      );
      return result;
    })
  );

  logger.info(`[Search] Getting profile socials for all members`);
  const allConversationsWithMemberProfileSocials = await Promise.all(
    allConversationsWithMemberIds.map(async (c) => {
      const memberProfileSocials = await Promise.all(
        c.memberAddresses.map(async (memberId) => {
          const profileSocials = await getProfileSocialsQueryData(memberId);
          return {
            [memberId]: profileSocials,
          };
        })
      );
      const result = {
        ...c,
        memberProfileSocials,
      };
      logger.info(
        `[Search] Conversation with profiles:`,
        JSON.stringify(result, null, 2)
      );
      return result;
    })
  );

  const normalizedSearchQuery = searchQuery.toLowerCase();
  logger.info(`[Search] Normalized search query: ${normalizedSearchQuery}`);

  const result =
    allConversationsWithMemberProfileSocials.reduce<IConversationMembershipSearchResult>(
      (acc, conversation) => {
        // Search through group names
        if (
          conversation.conversationName
            ?.toLowerCase()
            .includes(normalizedSearchQuery) &&
          !conversation.conversationName.includes("/proto")
        ) {
          logger.info(
            `[Search] Found matching group name: ${conversation.conversationName}`
          );

          acc.existingGroupNameSearchResults = [
            ...(acc.existingGroupNameSearchResults || []),
            {
              groupName: conversation.conversationName,
              groupId: conversation.topic,
              groupImageUri: conversation.conversationImageUri || "",
              firstThreeMemberNames: conversation.memberAddresses
                .filter(
                  (memberAddress) => memberAddress !== getCurrentAccount()!
                )
                .slice(0, 3)
                .map((memberAddress) => getReadableProfile(memberAddress)),
            },
          ];
        }

        // Search through member profiles
        conversation.memberProfileSocials.forEach((memberProfileObj) => {
          const [memberId, profileSocials] =
            Object.entries(memberProfileObj)[0];
          if (!profileSocials) {
            logger.info(`[Search] No profile socials for member: ${memberId}`);
            return;
          }

          logger.info(
            `[Search] Checking member profile:`,
            JSON.stringify(profileSocials, null, 2)
          );
          const isMatch =
            // Match address
            profileSocials.address
              ?.toLowerCase()
              .includes(normalizedSearchQuery) ||
            // Match ENS names
            profileSocials.ensNames?.some(
              (ens) =>
                ens.name.toLowerCase().includes(normalizedSearchQuery) ||
                ens.displayName?.toLowerCase().includes(normalizedSearchQuery)
            ) ||
            // Match Lens handles
            profileSocials.lensHandles?.some(
              (lens) =>
                lens.handle.toLowerCase().includes(normalizedSearchQuery) ||
                lens.name?.toLowerCase().includes(normalizedSearchQuery)
            ) ||
            // Match Farcaster usernames
            profileSocials.farcasterUsernames?.some(
              (farcaster) =>
                farcaster.username
                  .toLowerCase()
                  .includes(normalizedSearchQuery) ||
                farcaster.name?.toLowerCase().includes(normalizedSearchQuery)
            ) ||
            // Match Unstoppable domains
            profileSocials.unstoppableDomains?.some((domain) =>
              domain.domain.toLowerCase().includes(normalizedSearchQuery)
            ) ||
            // Match Converse usernames
            profileSocials.userNames?.some(
              (userName) =>
                userName.name.toLowerCase().includes(normalizedSearchQuery) ||
                userName.displayName
                  ?.toLowerCase()
                  .includes(normalizedSearchQuery)
            );

          if (isMatch) {
            logger.info(
              `[Search] Found matching profile for member: ${memberId}`
            );
            if (conversation.version === ConversationVersion.GROUP) {
              // Add to group member search results
              const memberAddress = Object.keys(memberProfileObj)[0];
              logger.info(`[Search] Adding to group member results`);
              const firstTwoMemberNames = conversation.memberAddresses
                .filter(
                  (memberAddress) => memberAddress !== getCurrentAccount()!
                )
                .filter((memberInArray) => memberInArray !== memberAddress)
                .slice(0, Math.min(conversation.memberAddresses.length, 2))
                .map((memberAddress) => getReadableProfile(memberAddress));

              // put member address  profiel data first in array
              const memberNameFromGroup = getReadableProfile(memberAddress);
              const firstThreeMemberNames = [
                memberNameFromGroup,
                ...firstTwoMemberNames,
              ];

              acc.existingGroupMemberNameSearchResults = [
                ...(acc.existingGroupMemberNameSearchResults || []),
                {
                  memberNameFromGroup: getReadableProfile(memberAddress),
                  groupName: conversation.conversationName || "",
                  groupId: conversation.topic,
                  groupImageUri: conversation.conversationImageUri || "",
                  firstThreeMemberNames,
                },
              ];
            } else {
              // Add to DM search results
              logger.info(`[Search] Adding to DM results`);
              acc.existingDmSearchResults = {
                ...(acc.existingDmSearchResults || {}),
                [memberId]: profileSocials,
              };
            }
          }
        });

        return acc;
      },
      {
        existingDmSearchResults: {},
        existingGroupMemberNameSearchResults: [],
        existingGroupNameSearchResults: [],
      }
    );

  logger.info(
    `[Search] Final search results:`,
    JSON.stringify(result, null, 2)
  );
  return result;
}

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
