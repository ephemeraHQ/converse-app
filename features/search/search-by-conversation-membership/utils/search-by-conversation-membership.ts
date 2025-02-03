import { getCurrentAccount } from "@/data/store/accountsStore";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { searchByConversationMembershipProcessor } from "./search-by-conversation-membership-processor";
import type {
  MemberProfile,
  SearchResults,
  SearchableConversation,
} from "./search-by-conversation-membership.types";

export async function searchByConversationMembership({
  searchQuery,
}: {
  searchQuery: string;
}) {
  const currentAccount = getCurrentAccount()!;

  // Get all allowed consent conversations for current account
  const conversations = await getAllowedConsentConversationsQueryData({
    account: currentAccount,
  });

  if (!conversations) {
    return {
      existingDmTopics: [],
      existingGroupsByMemberNameTopics: [],
      existingGroupsByGroupNameTopics: [],
    } satisfies SearchResults;
  }

  // Transform conversations into searchable format with member profiles
  const searchableConversations = await Promise.all(
    conversations.map(async (conversation) => {
      // Get members for each conversation
      const members = await ensureGroupMembersQueryData({
        account: currentAccount,
        topic: conversation.topic,
      });

      // Get profile data for each member
      const memberProfiles: MemberProfile[] = await Promise.all(
        members.addresses.map(async (address) => {
          const profile = await getProfileSocialsQueryData(address);
          return {
            address,
            profile: profile || null,
          };
        })
      );

      // Build searchable conversation object
      return {
        version: conversation.version,
        topic: conversation.topic,
        conversationName: isConversationGroup(conversation)
          ? conversation.name
          : undefined,
        conversationImageUri: isConversationGroup(conversation)
          ? conversation.imageUrlSquare
          : undefined,
        memberProfiles,
      } satisfies SearchableConversation;
    })
  );

  return searchByConversationMembershipProcessor({
    conversations: searchableConversations,
    searchQuery,
    currentUserAddress: currentAccount,
  });
}
