import type { SearchableConversation, SearchResults } from "./search-types";
import {
  doesGroupNameMatchQuery,
  doesMemberProfileMatchQuery,
} from "./search-helpers";
import { getReadableProfile } from "@/utils/getReadableProfile";
import { ConversationVersion } from "@xmtp/react-native-sdk";

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
        acc.existingGroupNameSearchResults.push({
          groupName: conversation.conversationName || "",
          groupId: conversation.topic,
          groupImageUri: conversation.conversationImageUri || "",
          firstThreeMemberNames: conversation.memberProfiles
            .filter((m) => m.address !== currentUserAddress)
            .slice(0, 3)
            .map((m) => getReadableProfile(m.address)),
        });
      }

      // Member profile matching
      conversation.memberProfiles.forEach((member) => {
        if (!member.profile) return;

        if (doesMemberProfileMatchQuery(member.profile, normalizedQuery)) {
          if (conversation.version === ConversationVersion.GROUP) {
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
                getReadableProfile(member.address),
                ...otherMembers,
              ].slice(0, 3),
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
