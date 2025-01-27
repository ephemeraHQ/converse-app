import type { SearchableConversation, SearchResults } from "./search-types";
import {
  doesGroupNameMatchQuery,
  doesMemberProfileMatchQuery,
} from "./search-helpers";
import { getReadableProfile } from "@/utils/getReadableProfile";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import logger from "@/utils/logger";

/**
 * Search Processing Rules:
 *
 * 1. Result Types:
 *    - DM conversations (existingDmSearchResults)
 *    - Group conversations by member name (existingGroupMemberNameSearchResults)
 *    - Group conversations by group name (existingGroupNameSearchResults)
 *
 * 2. Group Name Matching:
 *    - Groups are matched by their conversationName
 *    - Groups with "/proto" in their name are excluded
 *    - For matched groups, display:
 *      - Group name
 *      - Group ID (topic)
 *      - Group image URI
 *      - Member list ordering:
 *        1. Current user's name first
 *        2. Up to two more members if group size permits
 *
 * 3. Member Profile Matching:
 *    - For DMs:
 *      - Store the full profile of the matched member
 *      - Indexed by member address
 *    - For Groups:
 *      - Show the matched member's name first in the member list
 *      - Show the group name and image
 *      - Member list ordering:
 *        1. Matched member's name first
 *        2. Up to two arbitrary members from the group
 *
 * 4. Member Display Rules:
 *    - Member names are converted to readable format using getReadableProfile
 *    - For groups, we limit to 3 visible members maximum
 *
 * 5. Current User Exclusion:
 *    - Exclude matches where the search query matches the current user's profile
 *    - This prevents showing conversations where the only match is the user themselves
 */
export function processConversationSearch(
  conversations: SearchableConversation[],
  searchQuery: string,
  currentUserAddress: string
): SearchResults {
  logger.info(
    `[Search] Processing ${conversations.length} conversations for query: ${searchQuery}`
  );
  const normalizedQuery = searchQuery.toLowerCase();

  // Find current user's profile to check for self-matches
  const currentUserProfile = conversations
    .flatMap((conv) => conv.memberProfiles)
    .find((member) => member.address === currentUserAddress)?.profile;

  // Check if the search query matches the current user's profile
  const isCurrentUserMatch =
    currentUserProfile &&
    doesMemberProfileMatchQuery(currentUserProfile, normalizedQuery);

  // If the search matches the current user's profile, return empty results
  if (isCurrentUserMatch) {
    logger.info(
      `[Search] Search query matches current user's profile, returning empty results`
    );
    return {
      existingDmSearchResults: [],
      existingGroupMemberNameSearchResults: [],
      existingGroupNameSearchResults: [],
    };
  }

  return conversations.reduce<SearchResults>(
    (acc, conversation) => {
      logger.info(`[Search] Processing conversation: ${conversation.topic}`);

      // Group name matching
      if (
        doesGroupNameMatchQuery(
          conversation.conversationName,
          normalizedQuery
        ) &&
        !conversation.conversationName?.includes("/proto")
      ) {
        logger.info(
          `[Search] Found group name match for: ${conversation.conversationName}`
        );

        // For group name matches, show current user first and up to 2 other members
        const otherMembers = conversation.memberProfiles
          .filter((m) => m.address !== currentUserAddress)
          .slice(0, 2)
          .map((m) => getReadableProfile(m.address));

        logger.info(
          `[Search] Adding group with ${otherMembers.length} other members to group name results`
        );

        acc.existingGroupNameSearchResults.push({
          groupName: conversation.conversationName || "",
          groupId: conversation.topic,
          groupImageUri: conversation.conversationImageUri || "",
          firstThreeMemberNames: [
            // Current user first
            getReadableProfile(currentUserAddress),
            // Then up to 2 other members
            ...otherMembers,
          ],
        });
      }

      // Member profile matching
      conversation.memberProfiles.forEach((member) => {
        if (!member.profile || member.address === currentUserAddress) {
          logger.info(
            `[Search] Skipping member ${member.address} - no profile found or is current user`
          );
          return;
        }

        if (doesMemberProfileMatchQuery(member.profile, normalizedQuery)) {
          logger.info(
            `[Search] Found member profile match for: ${member.address}`
          );

          if (conversation.version === ConversationVersion.GROUP) {
            logger.info(`[Search] Processing group conversation member match`);

            // For member matches, matched member should be first
            const otherMembers = conversation.memberProfiles
              .filter(
                (m) =>
                  m.address !== currentUserAddress &&
                  m.address !== member.address
              )
              .slice(0, 2)
              .map((m) => getReadableProfile(m.address));

            logger.info(
              `[Search] Adding group with ${otherMembers.length} other members to member name results`
            );

            acc.existingGroupMemberNameSearchResults.push({
              memberNameFromGroup: getReadableProfile(member.address),
              groupName: conversation.conversationName || "",
              groupId: conversation.topic,
              groupImageUri: conversation.conversationImageUri || "",
              firstThreeMemberNames: [
                // Matched member first
                getReadableProfile(member.address),
                // Then other members
                ...otherMembers,
              ],
            });
          } else {
            logger.info(
              `[Search] Adding DM conversation match for: ${member.address}`
            );
            acc.existingDmSearchResults.push(member.profile);
          }
        }
      });

      return acc;
    },
    {
      existingDmSearchResults: [],
      existingGroupMemberNameSearchResults: [],
      existingGroupNameSearchResults: [],
    }
  );
}
