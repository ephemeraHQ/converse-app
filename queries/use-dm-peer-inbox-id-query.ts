import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import logger from "@/utils/logger";
import { useQuery } from "@tanstack/react-query";
import { type ConversationTopic } from "@xmtp/react-native-sdk";
import { dmPeerInboxIdQueryKey } from "./QueryKeys";
import { getOrFetchConversation } from "./conversation-query";
import { reactQueryPersister } from "@/utils/mmkv";

export const useDmPeerInboxIdQuery = (args: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) => {
  const { account, topic, caller } = args;

  return useQuery({
    queryKey: dmPeerInboxIdQueryKey(account, topic),
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
        `[getPeerInboxId] getting peer inbox id for ${topic}, account: ${account} and caller ${caller}`
      );

      return conversation.peerInboxId();
    },
    enabled: !!account && !!topic,
    persister: reactQueryPersister,
  });
};
