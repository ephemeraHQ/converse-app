/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { queryOptions } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import { getXmtpDmByInboxId } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-dm";
import { queryClient } from "@/queries/queryClient";
import { setConversationQueryData } from "./conversation-query";
import { dmQueryKey } from "./QueryKeys";

type IDmQueryArgs = {
  ethAccountAddress: string;
  inboxId: InboxId;
};

type IDmQueryData = Awaited<ReturnType<typeof getXmtpDmByInboxId>>;

async function getDm(args: IDmQueryArgs) {
  const { ethAccountAddress: ethAccountAddress, inboxId } = args;

  const conversation = await getXmtpDmByInboxId({
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

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { ethAccountAddress, inboxId, dm } = args;
  queryClient.setQueryData(
    getDmQueryOptions({ ethAccountAddress, inboxId }).queryKey,
    dm,
  );

  // Update the main conversation query because it's a 1-1
  if (dm) {
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
