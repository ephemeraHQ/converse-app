import { setConversationQueryData } from "@/queries/useConversationQuery";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import logger from "@utils/logger";
import { ConversationWithCodecsType } from "@utils/xmtpRN/client";
import { getConversationByPeerByAccount } from "@utils/xmtpRN/conversations";
import { conversationWithPeerQueryKey } from "./QueryKeys";

export const useConversationWithPeerQuery = (
  account: string,
  peer: string,
  options?: Partial<UseQueryOptions<ConversationWithCodecsType | null>>
) => {
  return useQuery({
    ...options,
    queryKey: conversationWithPeerQueryKey(account, peer!),
    queryFn: async () => {
      logger.info("[Crash Debug] queryFn fetching conversation with peer");
      if (!peer) {
        return null;
      }
      const conversation = await getConversationByPeerByAccount({
        account,
        peer,
        includeSync: true,
      });

      if (!conversation) {
        return null;
      }

      setConversationQueryData(account, conversation.topic, conversation);

      return conversation;
    },
    enabled: !!peer,
  });
};
