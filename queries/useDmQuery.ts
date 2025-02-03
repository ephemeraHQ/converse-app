/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { queryClient } from "@/queries/queryClient";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getConversationByPeerByAccount } from "@/utils/xmtpRN/conversations";
import { dmQueryKey } from "./QueryKeys";
import { setConversationQueryData } from "./conversation-query";

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
  });

  if (conversation) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      account,
      topic: conversation.topic,
      conversation,
    });
  }

  return conversation;
}

export function getDmQueryOptions(args: IDmQueryArgs) {
  const { account, peer } = args;
  return queryOptions({
    queryKey: dmQueryKey(account, peer),
    queryFn: () => getDm({ account, peer }),
    enabled: !!peer,
  });
}

export function useDmQuery(args: IDmQueryArgs) {
  return useQuery(getDmQueryOptions(args));
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { account, dm } = args;
  queryClient.setQueryData(getDmQueryOptions(args).queryKey, dm);
  if (dm) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      account,
      topic: dm.topic,
      conversation: dm,
    });
  }
}

export function getDmQueryData(args: IDmQueryArgs) {
  return queryClient.getQueryData(getDmQueryOptions(args).queryKey);
}
