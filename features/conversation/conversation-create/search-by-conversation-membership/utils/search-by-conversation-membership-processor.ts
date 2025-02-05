import logger from "@/utils/logger";
import { ConversationVersion, InboxId } from "@xmtp/react-native-sdk";
import {
  doesGroupNameMatchQuery,
  doesSocialsMatchQuery,
} from "./search-by-conversation-membership.helpers";
import type {
  SearchResults,
  SearchableConversation,
} from "./search-by-conversation-membership.types";

export function searchByConversationMembershipProcessor(args: {
  conversations: SearchableConversation[];
  searchQuery: string;
  currentUserInboxId: InboxId;
}) {
  const { conversations, searchQuery } = args;

  const normalizedQuery = searchQuery.toLowerCase();

  // Find current user's profile to check for self-matches
  // const currentUserSocials = conversations
  //   .flatMap((conv) => conv.memberProfiles)
  //   .find((member) => member.inboxId === currentUserInboxId)?.socials;

  // // Check if the search query matches the current user's profile
  // const isCurrentUserMatch =
  //   currentUserSocials &&
  //   doesSocialsMatchQuery({
  //     socials: currentUserSocials,
  //     normalizedQuery,
  //   });

  // // If the search matches the current user's profile, return empty results
  // if (isCurrentUserMatch) {
  //   logger.info(
  //     `[Search] Search query matches current user's profile, returning empty results`
  //   );
  //   return {
  //     existingDmTopics: [],
  //     existingGroupsByMemberNameTopics: [],
  //     existingGroupsByGroupNameTopics: [],
  //   };
  // }

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
        // if (member.inboxId === currentUserInboxId) {
        //   return;
        // }

        if (!member.socials) {
          return;
        }

        if (
          doesSocialsMatchQuery({
            socials: member.socials,
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
