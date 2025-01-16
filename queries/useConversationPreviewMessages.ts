import logger from "@/utils/logger";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { getConversationByTopicByAccount } from "@/utils/xmtpRN/conversations";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";
import { queryClient } from "./queryClient";
import { conversationPreviewMessagesQueryKey } from "./QueryKeys";
import {
  ConversationMessagesQueryData,
  conversationMessagesQueryFn,
  getConversationMessagesQueryOptions,
} from "./useConversationMessages";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { getConversationQueryData } from "./useConversationQuery";

const conversationPreviewMessagesQueryFn = async (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const conversation = getConversationQueryData({
    account,
    topic,
    context: "conversationPreviewMessagesQueryFn",
  });

  logger.info(
    "[ConversationPreview Messages]conversationPreviewMessagesQueryFn",
    {
      topic: conversation?.topic,
    }
  );
  const start = Date.now();
  const messages = await conversationMessagesQueryFn(conversation!, {
    limit: 10,
  });
  const end = Date.now();
  logger.info(
    "[ConversationPreview Messages]conversationPreviewMessagesQueryFn",
    {
      topic: conversation?.topic,
      duration: end - start,
      messages: messages.ids.length,
    }
  );
  return messages;
};

export const useConversationPreviewMessagesForCurrentAccount = ({
  topic,
  options,
}: {
  topic: ConversationTopic;
  options?: Partial<UseQueryOptions<ConversationMessagesQueryData>>;
}) => {
  const currentAccount = useCurrentAccount()!;
  // const { data: conversation } = useQuery({
  //   ...getConversationMessagesQueryOptions(currentAccount, topic),
  //   ...cacheOnlyQueryOptions,
  // });

  return useQuery({
    queryKey: conversationPreviewMessagesQueryKey(currentAccount, topic),
    queryFn: () =>
      conversationPreviewMessagesQueryFn({ account: currentAccount, topic }),
    enabled: !!currentAccount && !!topic,
    ...options,
  });
};

export const prefetchConversationPreviewMessages = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.prefetchQuery({
    queryKey: conversationPreviewMessagesQueryKey(account, topic),
    queryFn: async () => {
      return conversationPreviewMessagesQueryFn({ account, topic });
    },
  });
};
