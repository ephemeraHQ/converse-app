import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationMessageQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { getConversationMessages } from "./useConversationMessages";

type ConversationMessage = ReturnType<typeof fetchConversationMessage>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
  messageId: string;
};

function fetchConversationMessage(args: IArgs) {
  const { account, topic, messageId } = args;
  const messages = getConversationMessages(account, topic);
  return messages?.byId[messageId];
}

export const useConversationMessage = (args: IArgs) => {
  const { account, topic, messageId } = args;
  return useQuery({
    queryKey: conversationMessageQueryKey(account, topic, messageId),
    queryFn: () => fetchConversationMessage(args),
  });
};

export const getConversationMessage = (args: IArgs) => {
  const { account, topic, messageId } = args;
  return queryClient.getQueryData<ConversationMessage>(
    conversationMessageQueryKey(account, topic, messageId)
  );
};
