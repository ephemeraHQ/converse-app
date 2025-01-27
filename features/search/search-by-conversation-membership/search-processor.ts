import type { SearchableConversation, SearchResults } from "./search-types";
import {
  doesGroupNameMatchQuery,
  doesMemberProfileMatchQuery,
} from "./search-helpers";
import { getReadableProfile } from "@/utils/getReadableProfile";
import { ConversationVersion } from "@xmtp/react-native-sdk";

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
 */
export function processConversationSearch(
  conversations: SearchableConversation[],
  searchQuery: string,
  currentUserAddress: string
): SearchResults {
  const normalizedQuery = searchQuery.toLowerCase();

  return conversations.reduce<SearchResults>(
    (acc, conversation) => {
      // Group name matching
      if (
        doesGroupNameMatchQuery(
          conversation.conversationName,
          normalizedQuery
        ) &&
        !conversation.conversationName?.includes("/proto")
      ) {
        // For group name matches, show current user first and up to 2 other members
        const otherMembers = conversation.memberProfiles
          .filter((m) => m.address !== currentUserAddress)
          .slice(0, 2)
          .map((m) => getReadableProfile(m.address));

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
        if (!member.profile) return;

        if (doesMemberProfileMatchQuery(member.profile, normalizedQuery)) {
          if (conversation.version === ConversationVersion.GROUP) {
            // For member matches, matched member should be first
            const otherMembers = conversation.memberProfiles
              .filter(
                (m) =>
                  m.address !== currentUserAddress &&
                  m.address !== member.address
              )
              .slice(0, 2)
              .map((m) => getReadableProfile(m.address));

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
            acc.existingDmSearchResults[member.address] = member.profile;
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
}
