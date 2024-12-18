import {
  conversationListQueryConfig,
  replaceConversationInConversationListQuery,
} from "@/queries/useConversationListQuery";
import {
  QueryObserver,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import React from "react";
import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

function getConversation(args: IArgs) {
  const { account, topic } = args;
  return getConversationByTopicByAccount({
    account,
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

  // Individual conversation query
  const query = useQuery({
    ...getConversationQueryOptions({ account, topic }),
    ...queryOptions,
  });

  // Keep in sync with conversation list
  React.useEffect(() => {
    const observer = new QueryObserver(
      queryClient,
      conversationListQueryConfig({ account, context: "useConversationQuery" })
    );

    observer.subscribe(({ data: conversations }) => {
      const currentConversation =
        queryClient.getQueryData<ConversationQueryData>(
          conversationQueryKey(account, topic)
        );

      const listConversation = conversations?.find(
        (c) => c.topic === currentConversation?.topic
      );

      if (listConversation) {
        // List is source of truth
        queryClient.setQueryData<ConversationQueryData>(
          conversationQueryKey(account, topic),
          listConversation
        );
      }
    });

    return () => observer.destroy();
  }, [account, topic]);

  return query;
};

export function getConversationQueryOptions(args: IArgs) {
  const { account, topic } = args;
  return {
    queryKey: conversationQueryKey(account, topic),
    queryFn: () => getConversation({ account, topic: topic! }),
    enabled: !!topic,
  };
}

export const invalidateConversationQuery = (args: IArgs) => {
  const { account, topic } = args;
  return queryClient.invalidateQueries({
    queryKey: conversationQueryKey(account, topic),
  });
};

export const setConversationQueryData = (
  args: IArgs & {
    conversation: ConversationQueryData;
  }
) => {
  const { account, topic, conversation } = args;
  // Source of truth for now
  replaceConversationInConversationListQuery({
    account,
    topic,
    conversation,
  });
};

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
