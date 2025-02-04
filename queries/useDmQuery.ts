/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { queryClient } from "@/queries/queryClient";
import { getConversationByPeerByAccount } from "@/utils/xmtpRN/conversations";
import { getDmByInboxId } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-dm";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import { dmQueryKey } from "./QueryKeys";
import { setConversationQueryData } from "./conversation-query";

type IDmQueryArgs = {
  ethAccountAddress: string;
  inboxId: InboxId;
};

type IDmQueryData = Awaited<ReturnType<typeof getConversationByPeerByAccount>>;

async function getDm(args: IDmQueryArgs) {
  const { ethAccountAddress: ethAccountAddress, inboxId } = args;

  const conversation = await getDmByInboxId({
    ethAccountAddress,
    inboxId,
  });

  if (conversation) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      account: ethAccountAddress,
      topic: conversation.topic,
      conversation,
    });
  }

  return conversation;
}

export function getDmQueryOptions(args: IDmQueryArgs) {
  const { ethAccountAddress, inboxId } = args;
  return queryOptions({
    queryKey: dmQueryKey({ account: ethAccountAddress, inboxId }),
    queryFn: () => getDm({ ethAccountAddress: ethAccountAddress, inboxId }),
    enabled: !!inboxId,
  });
}

export function useDmQuery(args: IDmQueryArgs) {
  return useQuery(getDmQueryOptions(args));
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { ethAccountAddress, inboxId, dm } = args;
  queryClient.setQueryData(
    getDmQueryOptions({ ethAccountAddress, inboxId }).queryKey,
    dm
  );
  if (dm) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      account: ethAccountAddress,
      topic: dm.topic,
      conversation: dm,
    });
  }
}

export function getDmQueryData(args: IDmQueryArgs) {
  return queryClient.getQueryData(getDmQueryOptions(args).queryKey);
}
