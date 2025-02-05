import { getCurrentAccount } from "@/data/store/accountsStore";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { ensureInboxProfileSocialsQueryData } from "@/queries/useInboxProfileSocialsQuery";
import { searchByConversationMembershipProcessor } from "./search-conversations-processor";
import type {
  SearchConversationsMemberProfile,
  SearchConversationsResults,
  SearchConversationsSearchableConversation,
} from "./search-conversations.types";

export async function searchByConversationMembership(args: {
  searchQuery: string;
}) {
  const { searchQuery } = args;

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
    } satisfies SearchConversationsResults;
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
      const memberProfiles: SearchConversationsMemberProfile[] =
        await Promise.all(
          members.ids.map(async (inboxId) => {
            const socials = await ensureInboxProfileSocialsQueryData({
              inboxId,
              caller: "searchByConversationMembership",
            });
            return {
              inboxId,
              socials,
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
      } satisfies SearchConversationsSearchableConversation;
    })
  );

  return searchByConversationMembershipProcessor({
    conversations: searchableConversations,
    searchQuery,
    currentUserInboxId: currentAccount,
  });
}
