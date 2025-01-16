import { conversationPreviewMessagesQueryKey } from "@/queries/QueryKeys";
import {
  ConversationMessagesQueryData,
  conversationMessagesQueryFn,
} from "@/queries/use-conversation-messages-query";
import logger from "@/utils/logger";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export const useConversationPreviewMessages = (
  account: string,
  topic: ConversationTopic,
  options?: Partial<UseQueryOptions<ConversationMessagesQueryData>>
) => {
  return useQuery({
    queryKey: conversationPreviewMessagesQueryKey(account, topic),
    queryFn: () => {
      logger.debug(
        `[ConversationPreview Messages] Fetching messages for ${topic} with account ${account}`
      );

      return conversationMessagesQueryFn({
        account,
        topic,
        options: {
          limit: 10,
        },
      });
    },
    enabled: !!topic && !!account,
    ...options,
  });
};
