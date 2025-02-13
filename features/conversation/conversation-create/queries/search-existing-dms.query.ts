import { doesSocialsMatchTextQuery } from "@/features/profiles/utils/does-socials-match-text-query";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { getSearchExistingDmsQueryKey } from "@/queries/QueryKeys";
import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { ensureDmPeerInboxIdQueryData } from "@/queries/use-dm-peer-inbox-id-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { ensureInboxProfileSocialsQueryData } from "@/queries/useInboxProfileSocialsQuery";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { getCurrentAccountEthAddress } from "@/features/authentication/account.store";
import { normalizeString } from "@/utils/str";

export async function searchExistingDms(args: {
  searchQuery: string;
  inboxId: InboxId;
}) {
  const { searchQuery, inboxId } = args;
  const currentAccount = getCurrentAccountEthAddress()!;
  const conversations = getAllowedConsentConversationsQueryData({
    account: currentAccount,
  });
  const normalizedSearchQuery = searchQuery.toLowerCase().trim();

  if (!conversations) {
    return [];
  }

  if (!normalizedSearchQuery) {
    return [];
  }

  const matchingTopics: ConversationTopic[] = [];
  const dmConversations = conversations.filter(isConversationDm);

  const results = await Promise.all(
    dmConversations.map(async (conversation) => {
      try {
        // Try to get peer inbox ID either from members or direct query
        const [peerInboxId, members] = await Promise.race([
          // Get peer inbox ID from members
          ensureGroupMembersQueryData({
            caller: "searchExistingDms",
            account: currentAccount,
            topic: conversation.topic,
          }).then((members) => {
            const otherId = members.ids.find((id) => id !== inboxId);
            return [otherId, members] as const;
          }),
          // Get peer inbox ID directly
          ensureDmPeerInboxIdQueryData({
            account: currentAccount,
            topic: conversation.topic,
            caller: "searchExistingDms",
          }).then((peerId) => [peerId, null] as const),
        ]);

        const otherMemberInboxId =
          peerInboxId || members?.ids.find((id) => id !== inboxId);

        if (!otherMemberInboxId) {
          throw new Error("No other member inbox Id found for conversation DM");
        }

        const socials = await ensureInboxProfileSocialsQueryData({
          inboxId: otherMemberInboxId,
          caller: "searchExistingDms",
        });

        if (!socials) {
          return null;
        }

        const hasMatch = doesSocialsMatchTextQuery({
          socials,
          normalizedQuery: normalizedSearchQuery,
        });

        return hasMatch ? conversation.topic : null;
      } catch {
        return null;
      }
    })
  );

  matchingTopics.push(...results.filter(Boolean));

  return matchingTopics;
}

export function getSearchExistingDmsQueryOptions(args: {
  searchQuery: string;
  inboxId: InboxId;
}) {
  const { searchQuery, inboxId } = args;
  const normalizedSearchQuery = normalizeString(args.searchQuery);
  return queryOptions({
    // NOT sure why this Eslint error
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getSearchExistingDmsQueryKey({
      searchQuery: normalizedSearchQuery,
      inboxId,
    }),
    queryFn: () => searchExistingDms(args),
    enabled: !!inboxId && !!searchQuery,
    staleTime: 0,
  });
}

export function useSearchExistingDms(args: {
  searchQuery: string;
  inboxId: InboxId;
}) {
  return useQuery(getSearchExistingDmsQueryOptions(args));
}
