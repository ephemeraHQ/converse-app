import { generateGroupHashFromMemberIds } from "@/features/create-conversation/generate-group-hash-from-member-ids";
import { getConversationsQueryOptions } from "@/queries/use-conversations-query";
import { getGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import logger from "@/utils/logger";
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { ConversationVersion, InboxId } from "@xmtp/react-native-sdk";

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

export const useFindConversationByMembers = (membersToSearch: InboxId[]) => {
  const account = useCurrentAccount();

  logger.debug(
    `[useFindConversationByMembers] Finding conversation for members:`,
    membersToSearch
  );

  const { data: conversations, isLoading } = useQuery({
    ...getConversationsQueryOptions({
      account: account!,
      caller: "useConversationByMembers",
    }),
    select: (conversations) => {
      logger.debug(
        `[useFindConversationByMembers] Searching through ${conversations?.length} conversations`
      );

      const groupsThatIncludeMembers = conversations
        // ?.filter(
        //   (conversation) => conversation.version === ConversationVersion.GROUP
        // )
        .filter((c) => {
          if (membersToSearch.length === 0) {
            return false;
          }
          logger.debug(
            `[useFindConversationByMembers] Checking conversation ${c.topic}`
          );

          const groupMembers = getGroupMembersQueryData(account!, c.topic);
          logger.debug(
            `[useFindConversationByMembers] Group members for ${c.topic}:`,
            groupMembers?.ids
          );

          const membersIdsSet = new Set(
            groupMembers?.addresses.map((address) => address.toLowerCase()) ??
              []
          );
          const membersToSearchSet = new Set(
            membersToSearch.map((member) => member.toLowerCase())
          );

          logger.debug(
            `[useFindConversationByMembers] Checking if\n${Array.from(
              membersToSearchSet
            )}\n is subset of\n${Array.from(membersIdsSet).join("\n")}`
          );

          const areMembersToSearchAllInGroup = membersToSearch.every((member) =>
            membersIdsSet.has(member.toLowerCase())
          );

          logger.debug(
            `[useFindConversationByMembers] Members are ${
              areMembersToSearchAllInGroup ? "" : "not "
            }all in group ${c.topic}`
          );

          return areMembersToSearchAllInGroup;
        });

      logger.debug(
        `[useFindConversationByMembers] Found ${groupsThatIncludeMembers?.length} conversations that include members`
      );

      return groupsThatIncludeMembers;
    },
    enabled: !!membersToSearch && membersToSearch.length > 0,
  });

  logger.debug(
    `[useFindConversationByMembers] Returning:`,
    `isLoading=${isLoading}`
  );

  return { conversations, isLoading };
};
