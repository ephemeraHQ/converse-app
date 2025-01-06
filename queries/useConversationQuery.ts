import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

type IArgs = {
  inboxId: string;
  topic: ConversationTopic;
};

function getConversation(args: IArgs) {
  const { inboxId, topic } = args;
  return getConversationByTopicByAccount({
    inboxId,
    topic,
    includeSync: true,
  });
}

export const useConversationQuery = (
  args: IArgs & {
    queryOptions?: Partial<UseQueryOptions<ConversationQueryData>>;
  }
) => {
  const { account, topic, queryOptions } = args;
  return useQuery({
    ...getConversationQueryOptions({ account, topic }),
    ...queryOptions,
  });
};

export function getConversationQueryOptions(args: IArgs) {
  const { account, topic } = args;
  return {
    queryKey: conversationQueryKey(account, topic),
    queryFn: () => getConversation({ account, topic: topic! }),
    enabled: !!topic,
  };
}

export const setConversationQueryData = (
  args: IArgs & {
    conversation: ConversationQueryData;
  }
) => {
  const { account, topic, conversation } = args;
  queryClient.setQueryData<ConversationQueryData>(
    conversationQueryKey(account, topic),
    conversation
  );
};

export function updateConversationQueryData(
  args: IArgs & { conversationUpdate: Partial<ConversationQueryData> }
) {
  const { account, topic, conversationUpdate } = args;
  queryClient.setQueryData<ConversationQueryData>(
    conversationQueryKey(account, topic),
    (previousConversation) => {
      if (!previousConversation) {
        return undefined;
      }
      return mutateObjectProperties(previousConversation, conversationUpdate);
    }
  );
}

export function refetchConversationQuery(args: IArgs) {
  const { account, topic } = args;
  return queryClient.refetchQueries({
    queryKey: conversationQueryKey(account, topic),
  });
}

export const getConversationQueryData = (args: IArgs) => {
  const { account, topic } = args;
  return queryClient.getQueryData<ConversationQueryData>(
    conversationQueryKey(account, topic)
  );
};
