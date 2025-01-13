import { conversationDataQueryKey } from "@/queries/QueryKeys";
import { getTopics } from "@/utils/api/topics";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { create, windowScheduler } from "@yornaath/batshit";
import { queryClient } from "./queryClient";

export type IConversationDataQueryData = Awaited<
  ReturnType<typeof getConversationData>
>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

export const useConversationDataQuery = (
  args: IArgs & {
    queryOptions?: Partial<UseQueryOptions<IConversationDataQueryData>>;
  }
) => {
  const { account, topic, queryOptions } = args;
  return useQuery({
    ...getConversationDataQueryOptions({ account, topic }),
    ...queryOptions,
  });
};

export function getConversationDataQueryOptions(args: IArgs) {
  const { account, topic } = args;
  return {
    queryKey: conversationDataQueryKey(account, topic),
    queryFn: () => getConversationData({ account, topic: topic! }),
    enabled: !!topic,
  };
}

export function prefetchConversationDataQuery(args: IArgs) {
  return queryClient.prefetchQuery(getConversationDataQueryOptions(args));
}

export const getConversationDataQueryData = (args: IArgs) => {
  const { account, topic } = args;
  return queryClient.getQueryData<IConversationDataQueryData>(
    conversationDataQueryKey(account, topic)
  );
};

export function getOrFetchConversationData(args: IArgs) {
  const data = getConversationDataQueryData(args);
  if (data) {
    return Promise.resolve(data);
  }
  return queryClient.fetchQuery(getConversationDataQueryOptions(args));
}

export function setConversationDataQueryData(
  args: IArgs & { data: Partial<IConversationDataQueryData> }
) {
  const { account, topic, data } = args;
  queryClient.setQueryData<IConversationDataQueryData>(
    conversationDataQueryKey(account, topic),
    (previousData) => {
      if (!previousData) return undefined;
      return {
        ...previousData,
        ...data,
      };
    }
  );
}

async function getConversationData(args: IArgs) {
  return batchedGetConversationTopicData.fetch(args);
}

const batchedGetConversationTopicData = create({
  scheduler: windowScheduler(50),
  resolver: (items, query) => {
    const match = items.find(
      (item) =>
        `${query.account}-${query.topic}` === `${item.account}-${item.topic}`
    );
    if (!match) return undefined;
    // Destructure to remove account and topic from the result
    const { account, topic, ...rest } = match;
    return rest;
  },
  fetcher: async (args: IArgs[]) => {
    const accountGroups = args.reduce(
      (groups, arg) => {
        groups[arg.account] = groups[arg.account] || [];
        groups[arg.account].push(arg);
        return groups;
      },
      {} as Record<string, IArgs[]>
    );

    const results = await Promise.all(
      Object.entries(accountGroups).map(async ([account, groupArgs]) => {
        const conversationsData = await getTopics({
          account,
        });

        // Include topic in each item for resolver matching
        return groupArgs.map((arg) => ({
          ...conversationsData[arg.topic],
          account,
          topic: arg.topic,
        }));
      })
    );

    return results.flat();
  },
});
