/**
 * TODO: Maybe delete this and just use the conversation query instead and add a "peer" argument?
 */
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { queryClient } from "@/queries/queryClient";
import { conversationListQueryConfig } from "@/queries/useConversationListQuery";
import { captureError } from "@/utils/capture-error";
import { DmWithCodecsType } from "@/utils/xmtpRN/client";
import { QueryObserver, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversationByPeerByAccount,
  getPeerAddressDm,
} from "@utils/xmtpRN/conversations";
import { useEffect } from "react";
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: dmQueryKey(account, peer),
    queryFn: () => getDm(args),
    enabled: !!peer,
  });

  // Keep in sync with conversation list
  useEffect(() => {
    const observer = new QueryObserver(
      queryClient,
      conversationListQueryConfig({ account, context: "useDmQuery" })
    );

    observer.subscribe(async ({ data: conversations }) => {
      try {
        const currentConversation = queryClient.getQueryData<IDmQueryData>(
          dmQueryKey(account, peer)
        );

        // If we have the conversation in cache, sync with list
        if (currentConversation) {
          const listConversation = conversations?.find(
            (c): c is DmWithCodecsType =>
              c.topic === currentConversation.topic && isConversationDm(c)
          );

          if (listConversation) {
            queryClient.setQueryData<IDmQueryData>(
              dmQueryKey(account, peer),
              listConversation
            );
          }
          return;
        }

        // Try to find conversation by peer address in list
        const dmConversations = conversations?.filter(isConversationDm);

        if (!dmConversations?.length) {
          return;
        }

        const peerAddresses = await Promise.all(
          dmConversations.map(getPeerAddressDm)
        );

        const matchingConversationIndex = peerAddresses.findIndex(
          (address) => address === peer
        );

        if (matchingConversationIndex !== -1) {
          queryClient.setQueryData<IDmQueryData>(
            dmQueryKey(account, peer),
            dmConversations[matchingConversationIndex]
          );
        }
      } catch (error) {
        captureError(error);
      }
    });

    return () => observer.destroy();
  }, [queryClient, account, peer]);

  return query;
}

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { account, peer, dm } = args;
  queryClient.setQueryData<IDmQueryData>(dmQueryKey(account, peer), dm);
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
