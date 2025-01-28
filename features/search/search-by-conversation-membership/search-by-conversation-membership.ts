import { getCurrentAccount } from "@/data/store/accountsStore";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import logger from "@/utils/logger";
import { getConversationsQueryData } from "@/queries/use-conversations-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { IConversationMembershipSearchResult } from "@/features/search/search.types";
import { processConversationSearch } from "./search-processor";
import type { SearchableConversation, MemberProfile } from "./search-types";

export async function searchByConversationMembership({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<IConversationMembershipSearchResult> {
  // logger.info(
  //   `[Search] Starting conversation membership search for: ${searchQuery}`
  // );

  const currentAccount = getCurrentAccount()!;
  const conversations = await getConversationsQueryData({
    account: currentAccount,
  });
  // logger.info(
  //   `[Search] All conversations:`,
  //   JSON.stringify(conversations, null, 2)
  // );

  if (!conversations) {
    // logger.info(`[Search] No conversations found, returning empty results`);
    return {
      existingDmSearchResults: [],
      existingGroupMemberNameSearchResults: [],
      existingGroupNameSearchResults: [],
    };
  }

  // logger.info(`[Search] Processing ${conversations.length} conversations`);
  const searchableConversations = await Promise.all(
    conversations.map(async (conversation) => {
      const members = await ensureGroupMembersQueryData({
        account: currentAccount,
        topic: conversation.topic,
      });

      const memberProfiles: MemberProfile[] = await Promise.all(
        members.addresses.map(async (address) => {
          const profile = await getProfileSocialsQueryData(address);
          return {
            address,
            profile: profile || null,
          };
        })
      );

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
  // logger.info(
  //   `[Search] Searchable conversations:`,
  //   JSON.stringify(searchableConversations, null, 2)
  // );

  return processConversationSearch(
    searchableConversations,
    searchQuery,
    currentAccount
  );
}
