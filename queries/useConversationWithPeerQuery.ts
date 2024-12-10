import { queryClient } from "@/queries/queryClient";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import { useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { getConversationByPeerByAccount } from "@utils/xmtpRN/conversations";
import { conversationWithPeerQueryKey } from "./QueryKeys";

type ConversationWithPeerQueryData = Awaited<
  ReturnType<typeof getConversationByPeerByAccount>
>;

async function fetchConversationWithPeer(args: {
  account: string;
  peer: string;
}) {
  const { account, peer } = args;

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
}

export const useConversationWithPeerQuery = (account: string, peer: string) => {
  return useQuery({
    queryKey: conversationWithPeerQueryKey(account, peer!),
    queryFn: () => fetchConversationWithPeer({ account, peer }),
    enabled: !!peer,
  });
};

export function updateConversationWithPeerQueryData(
  account: string,
  peer: string,
  newConversation: DmWithCodecsType
) {
  queryClient.setQueryData<ConversationWithPeerQueryData>(
    conversationWithPeerQueryKey(account, peer),
    () => newConversation
  );
}
