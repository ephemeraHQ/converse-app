import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getConversationByTopicByInboxId } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

type IArgs = {
  inboxId: string | undefined;
  topic: ConversationTopic;
};

function getConversation(args: IArgs) {
  const { inboxId, topic } = args;
  return getConversationByTopicByInboxId({
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
  const { inboxId, topic, queryOptions } = args;
  return useQuery({
    ...getConversationQueryOptions({ inboxId, topic }),
    ...queryOptions,
  });
};

export function getConversationQueryOptions(args: IArgs) {
  return {
    queryKey: conversationQueryKey(args),
    queryFn: () => getConversation(args),
    enabled: !!args.topic && !!args.inboxId,
  };
}

export const setConversationQueryData = (
  args: IArgs & {
    conversation: ConversationQueryData;
  }
) => {
  const { inboxId, topic, conversation } = args;
  queryClient.setQueryData<ConversationQueryData>(
    conversationQueryKey({ inboxId, topic }),
    conversation
  );
};

export function updateConversationQueryData(
  args: IArgs & { conversationUpdate: Partial<ConversationQueryData> }
) {
  const { inboxId, topic, conversationUpdate } = args;
  queryClient.setQueryData<ConversationQueryData>(
    conversationQueryKey({ inboxId, topic }),
    (previousConversation: ConversationQueryData | undefined) => {
      if (!previousConversation) {
        return undefined;
      }
      return mutateObjectProperties(previousConversation, conversationUpdate);
    }
  );
}

export function refetchConversationQuery(args: IArgs) {
  const { inboxId, topic } = args;
  return queryClient.refetchQueries({
    queryKey: conversationQueryKey({ inboxId, topic }),
  });
}

export const getConversationQueryData = (args: IArgs) => {
  const { inboxId, topic } = args;
  return queryClient.getQueryData<ConversationQueryData>(
    conversationQueryKey({ inboxId, topic })
  );
};
