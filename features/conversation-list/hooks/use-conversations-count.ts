import { generateGroupHashFromMemberIds } from "@/features/create-conversation/generate-group-hash-from-member-ids";
import { getConversationsQueryOptions } from "@/queries/use-conversations-query";
import logger from "@/utils/logger";
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";

export const useAllowedConversationsCount = () => {
  const account = useCurrentAccount();

  const { data: count, isLoading } = useQuery({
    ...getConversationsQueryOptions({
      account: account!,
      caller: "useConversationsCount",
    }),
    select: (data) => data?.length ?? 0,
  });

  return { count, isLoading };
};

export const useFindConversationByMembers = (members: InboxId[]) => {
  const account = useCurrentAccount();

  logger.debug(
    `[useFindConversationByMembers] Finding conversation for members:`,
    members
  );

  const membersHash = generateGroupHashFromMemberIds([
    ...members,
    getCurrentAccount()!,
  ]);

  logger.debug(
    `[useFindConversationByMembers] Generated members hash: ${membersHash}`
  );

  const { data: conversation, isLoading } = useQuery({
    ...getConversationsQueryOptions({
      account: account!,
      caller: "useConversationByMembers",
    }),
    select: (data) => {
      logger.debug(
        `[useFindConversationByMembers] Searching through ${data?.length} conversations`
      );

      const found = data?.find((c) => {
        const matches = c.membersHash === membersHash;
        logger.debug(
          `[useFindConversationByMembers] Checking conversation ${c.topic}:`,
          `membersHash=${c.membersHash}`,
          `matches=${matches}`
        );
        return matches;
      });

      logger.debug(
        `[useFindConversationByMembers] Found conversation:`,
        found ? found.topic : "none"
      );

      return found;
    },
    enabled: !!membersHash,
  });

  logger.debug(
    `[useFindConversationByMembers] Returning:`,
    `conversation=${conversation?.topic ?? "nope!"}`,
    `isLoading=${isLoading}`
  );

  return { conversation, isLoading };
};
