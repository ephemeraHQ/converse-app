/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "" argument?
 */
import { queryClient } from "@/queries/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getConversationByPeerInboxId } from "@utils/xmtpRN/conversations";
import { dmQueryKey } from "./QueryKeys";
import { setConversationQueryData } from "./useConversationQuery";
import logger from "@/utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";

type IDmQueryArgs = {
  peerInboxId: InboxId;
};

type IDmQueryData = Awaited<
  ReturnType<typeof getConversationByPeerInboxId>
>;

async function getDm(args: IDmQueryArgs) {
  const { peerInboxId } = args;

  const conversation = await getConversationByPeerInboxId({
    peerInboxId
    
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
  const { inboxId,  } = args;

  return useQuery({
    queryKey: dmQueryKey({ inboxId,  }),
    queryFn: () => getDm(args),
    enabled: !! && !!inboxId,
  });
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { inboxId, , dm } = args;
  if (!inboxId) {
    logger.error("[setDmQueryData] Inbox ID is required");
    return;
  }
  queryClient.setQueryData<IDmQueryData>(
    dmQueryKey({ inboxId,  }),
    dm
  );
  // Also set there because it's a 1-1
  setConversationQueryData({
    inboxId,
    topic: dm.topic,
    conversation: dm,
  });
}

export function getDmQueryData(args: IDmQueryArgs) {
  const { inboxId,  } = args;
  return queryClient.getQueryData<IDmQueryData>(
    dmQueryKey({ inboxId,  })
  );
}
