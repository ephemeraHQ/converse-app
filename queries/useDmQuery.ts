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
