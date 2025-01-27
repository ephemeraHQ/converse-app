import { getCurrentAccount } from "@/data/store/accountsStore";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import logger from "@/utils/logger";
import { getConversationsQueryData } from "../../../queries/use-conversations-query";
import { ensureGroupMembersQueryData } from "../../../queries/useGroupMembersQuery";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import { getReadableProfile } from "@/utils/getReadableProfile";
import { IConversationMembershipSearchResult } from "@/features/search/search.types";

export async function searchByConversationMembership({
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
