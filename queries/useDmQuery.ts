/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { queryClient } from "@/queries/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getConversationByPeerByInboxId } from "@utils/xmtpRN/conversations";
import { dmQueryKey } from "./QueryKeys";
import { setConversationQueryData } from "./useConversationQuery";

type IDmQueryArgs = {
  inboxId?: string;
  peer: string;
};

type IDmQueryData = Awaited<ReturnType<typeof getConversationByPeerByInboxId>>;

async function getDm(args: IDmQueryArgs) {
  const { inboxId, peer } = args;

  const conversation = await getConversationByPeerByInboxId({
    inboxId,
    peer,
    includeSync: true,
  });

  // Update the main conversation query because it's a 1-1
  setConversationQueryData({
    inboxId,
    topic: conversation.topic,
    conversation,
  });

  return conversation;
}

export function useDmQuery(args: IDmQueryArgs) {
  const { inboxId, peer } = args;

  return useQuery({
    queryKey: dmQueryKey({ inboxId, peer }),
    queryFn: () => getDm(args),
    enabled: !!peer && !!inboxId,
  });
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { inboxId, peer, dm } = args;
  queryClient.setQueryData<IDmQueryData>(dmQueryKey({ inboxId, peer }), dm);
  // Also set there because it's a 1-1
  setConversationQueryData({
    inboxId,
    topic: dm.topic,
    conversation: dm,
  });
}

export function getDmQueryData(args: IDmQueryArgs) {
  const { inboxId, peer } = args;
  return queryClient.getQueryData<IDmQueryData>(dmQueryKey({ inboxId, peer }));
}
