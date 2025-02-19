import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { ensureProfileQueryData } from "@/features/profiles/profiles.query";
import { doesWeb3SocialsMatchTextQuery } from "@/features/profiles/utils/does-socials-match-text-query";
import { ensureSocialProfilesQueryData } from "@/features/social-profiles/social-lookup.query";
import { getSearchExistingDmsQueryKey } from "@/queries/QueryKeys";
import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { ensureDmPeerInboxIdQueryData } from "@/queries/use-dm-peer-inbox-id-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { normalizeString } from "@/utils/str";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";

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

async function searchExistingDms(args: {
  searchQuery: string;
  inboxId: InboxId;
}) {
  const { searchQuery, inboxId } = args;
  const currentAccount = getCurrentAccount()!;
  const conversations = getAllowedConsentConversationsQueryData({
    account: currentAccount,
  });
  const normalizedSearchQuery = searchQuery.toLowerCase().trim();

  if (!conversations) {
    return [];
  }

  // Return early if search query is empty
  if (!normalizedSearchQuery) {
    return [];
  }

  const matchingTopics: ConversationTopic[] = [];
  const dmConversations = conversations.filter(isConversationDm);

  const results = await Promise.all(
    dmConversations.map(async (conversation) => {
      try {
        // Get peer's inbox ID from either group members or DM peer data, using whichever returns first
        const [peerInboxId, members] = await Promise.race([
          ensureGroupMembersQueryData({
            caller: "searchExistingDms",
            account: currentAccount,
            topic: conversation.topic,
          }).then((members) => {
            const otherId = members.ids.find((id) => id !== inboxId);
            return [otherId, members] as const;
          }),

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

        const profile = await ensureProfileQueryData({
          xmtpId: otherMemberInboxId,
        });

        const hasProfileMatch = profile?.name
          ?.toLowerCase()
          .includes(normalizedSearchQuery);

        const socials = await ensureSocialProfilesQueryData({
          ethAddress: otherMemberInboxId,
        });

        const hasWeb3SocialProfileMatch = doesWeb3SocialsMatchTextQuery({
          web3SocialProfiles: socials,
          normalizedQuery: normalizedSearchQuery,
        });

        return hasProfileMatch || hasWeb3SocialProfileMatch
          ? conversation.topic
          : null;
      } catch (e) {
        captureError(e);
        return null;
      }
    })
  );

  // Filter out nulls and add matching topics to results
  matchingTopics.push(...results.filter(Boolean));

  return matchingTopics;
}
