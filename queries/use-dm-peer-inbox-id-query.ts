import { queryOptions, useQuery } from "@tanstack/react-query";
import { type ConversationTopic } from "@xmtp/react-native-sdk";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { queryClient } from "@/queries/queryClient";
import { Optional } from "@/types/general";
import logger from "@/utils/logger";
import { reactQueryPersister } from "@/utils/mmkv";
import { getOrFetchConversation } from "./conversation-query";
import { dmPeerInboxIdQueryKey } from "./QueryKeys";

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

type IArgsWithCaller = IArgs & { caller: string };

export function getDmPeerInboxIdQueryOptions(
  args: Optional<IArgsWithCaller, "caller">,
) {
  const { account, topic, caller } = args;

  return queryOptions({
    queryKey: dmPeerInboxIdQueryKey(args),
    queryFn: async function getPeerInboxId() {
      const conversation = await getOrFetchConversation({
        account,
        topic,
        caller: "getPeerInboxId",
      });

      if (!conversation) {
        throw new Error(`Conversation not found with caller ${caller}`);
      }

      if (!isConversationDm(conversation)) {
        throw new Error(`Conversation is not a DM with caller ${caller}`);
      }

      logger.debug(
        `[getPeerInboxId] getting peer inbox id for ${topic}, account: ${account} and caller ${caller}`,
      );

      return conversation.peerInboxId();
    },
    meta: {
      caller,
    },
    enabled: !!account && !!topic,
  });
}

export const useDmPeerInboxIdQuery = (args: IArgsWithCaller) => {
  return useQuery(getDmPeerInboxIdQueryOptions(args));
};

export const ensureDmPeerInboxIdQueryData = async (args: IArgsWithCaller) => {
  return queryClient.ensureQueryData(getDmPeerInboxIdQueryOptions(args));
};

export function getDmPeerInboxIdQueryData(args: IArgs) {
  return queryClient.getQueryData(getDmPeerInboxIdQueryOptions(args).queryKey);
}
