/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "" argument?
 */
import { queryClient } from "@/queries/queryClient";
import { useQuery } from "@tanstack/react-query";
import { findDmByPeerInboxId } from "@utils/xmtpRN/conversations";
import { dmQueryKey } from "./QueryKeys";
import { setConversationQueryData } from "./useConversationQuery";
import logger from "@/utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";
import { useCurrentInboxId } from "@/data/store/accountsStore";

type IDmQueryArgs = {
  ourInboxId: InboxId;
  peerInboxId: InboxId;
};

type IDmQueryData = Awaited<ReturnType<typeof findDmByPeerInboxId>>;

async function getDm(args: IDmQueryArgs) {
  const { ourInboxId, peerInboxId } = args;
  const dm = await findDmByPeerInboxId({
    forInboxId: ourInboxId,
    peerInboxId,
  });

  // Update the main dm query because it's a 1-1
  setConversationQueryData({
    inboxId: ourInboxId,
    topic: dm.topic,
    conversation: dm,
  });

  return dm;
}

export function useDmQuery(args: IDmQueryArgs) {
  const { peerInboxId } = args;
  const currentInboxId = useCurrentInboxId()!;

  return useQuery({
    queryKey: dmQueryKey({ inboxId: currentInboxId, peerInboxId }),
    queryFn: () => getDm(args),
    enabled: !!peerInboxId,
  });
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { ourInboxId, peerInboxId, dm } = args;
  if (!ourInboxId) {
    logger.error("[setDmQueryData] Inbox ID is required");
    return;
  }
  queryClient.setQueryData<IDmQueryData>(
    dmQueryKey({ inboxId: ourInboxId, peerInboxId }),
    dm
  );
  // Also set there because it's a 1-1
  setConversationQueryData({
    inboxId: ourInboxId,
    topic: dm.topic,
    conversation: dm,
  });
}

export function getDmQueryData(args: IDmQueryArgs) {
  const { ourInboxId, peerInboxId } = args;
  return queryClient.getQueryData<IDmQueryData>(
    dmQueryKey({ inboxId: ourInboxId, peerInboxId })
  );
}
