/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { queryClient } from "@/queries/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getConversationByPeerByAccount } from "@utils/xmtpRN/conversations";
import { dmQueryKey } from "./QueryKeys";
import { setConversationQueryData } from "./useConversationQuery";

type IDmQueryArgs = {
  account: string;
  peer: string;
};

type IDmQueryData = Awaited<ReturnType<typeof getConversationByPeerByAccount>>;

async function getDm(args: IDmQueryArgs) {
  const { account, peer } = args;

  const conversation = await getConversationByPeerByAccount({
    account,
    peer,
    includeSync: true,
  });

  // This will not happen because the above throws if not found
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Update the main conversation query because it's a 1-1
  setConversationQueryData({
    account,
    topic: conversation.topic,
    conversation,
  });

  return conversation;
}

export function useDmQuery(args: IDmQueryArgs) {
  const { account, peer } = args;

  return useQuery({
    queryKey: dmQueryKey(account, peer),
    queryFn: () => getDm(args),
    enabled: !!peer,
  });
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { account, peer, dm } = args;
  if (!dm) {
    // todo: better type handling of undefineds
    throw new Error("DM not found");
  }
  queryClient.setQueryData<IDmQueryData>(dmQueryKey(account, peer), dm);
  // Also set there because it's a 1-1
  setConversationQueryData({
    account,
    topic: dm.topic,
    conversation: dm,
  });
}

export function getDmQueryData(args: IDmQueryArgs) {
  const { account, peer } = args;
  return queryClient.getQueryData<IDmQueryData>(dmQueryKey(account, peer));
}
