import logger from "@/utils/logger";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import {
  doesGroupNameMatchQuery,
  doesMemberProfileMatchQuery,
} from "./search-by-conversation-membership.helpers";
import type {
  SearchResults,
  SearchableConversation,
} from "./search-by-conversation-membership.types";

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
export function searchByConversationMembershipProcessor(args: {
  conversations: SearchableConversation[];
  searchQuery: string;
  currentUserAddress: string;
}) {
  const { conversations, searchQuery, currentUserAddress } = args;

  const normalizedQuery = searchQuery.toLowerCase();

  // Find current user's profile to check for self-matches
  const currentUserProfile = conversations
    .flatMap((conv) => conv.memberProfiles)
    .find((member) => member.address === currentUserAddress)?.profile;

  // Check if the search query matches the current user's profile
  const isCurrentUserMatch =
    currentUserProfile &&
    doesMemberProfileMatchQuery({
      profile: currentUserProfile,
      normalizedQuery,
    });

  // If the search matches the current user's profile, return empty results
  if (isCurrentUserMatch) {
    logger.info(
      `[Search] Search query matches current user's profile, returning empty results`
    );
    return {
      existingDmTopics: [],
      existingGroupsByMemberNameTopics: [],
      existingGroupsByGroupNameTopics: [],
    };
  }

  return conversations.reduce<SearchResults>(
    (acc, conversation) => {
      // Group name matching
      if (
        doesGroupNameMatchQuery(
          conversation.conversationName,
          normalizedQuery
        ) &&
        !conversation.conversationName?.includes("/proto") &&
        !acc.existingGroupsByGroupNameTopics.includes(conversation.topic)
      ) {
        acc.existingGroupsByGroupNameTopics.push(conversation.topic);
      }

      // Member profile matching
      conversation.memberProfiles.forEach((member) => {
        if (!member.profile || member.address === currentUserAddress) {
          return;
        }

        if (
          doesMemberProfileMatchQuery({
            profile: member.profile,
            normalizedQuery,
          })
        ) {
          if (conversation.version === ConversationVersion.GROUP) {
            if (
              !acc.existingGroupsByMemberNameTopics.includes(conversation.topic)
            ) {
              acc.existingGroupsByMemberNameTopics.push(conversation.topic);
            }
          } else {
            if (!acc.existingDmTopics.includes(conversation.topic)) {
              acc.existingDmTopics.push(conversation.topic);
            }
          }
        }
      });

      return acc;
    },
    {
      existingDmTopics: [],
      existingGroupsByMemberNameTopics: [],
      existingGroupsByGroupNameTopics: [],
    }
  );
}
