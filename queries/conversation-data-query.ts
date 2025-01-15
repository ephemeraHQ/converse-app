import { conversationDataQueryKey } from "@/queries/QueryKeys";
import { getTopics } from "@/utils/api/topics";
import logger from "@/utils/logger";
import { queryOptions } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { create, windowScheduler } from "@yornaath/batshit";
import { queryClient } from "./queryClient";

export type IConversationDataQueryData = Awaited<
  ReturnType<typeof getConversationData>
>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
  context: string;
};

export function getConversationDataQueryOptions(args: IArgs) {
  return queryOptions({
    queryKey: conversationDataQueryKey(args.account, args.topic),
    queryFn: () => getConversationData(args),
    enabled: !!args.topic && !!args.account,
    retry: false,
  });
}

export function prefetchConversationDataQuery(args: IArgs) {
  logger.debug(
    `[ConversationDataQuery] prefetchConversationDataQuery for account: ${args.account}, topic: ${args.topic} and context: ${args.context}`
  );
  return queryClient.prefetchQuery(getConversationDataQueryOptions(args));
}

export const getConversationDataQueryData = (args: IArgs) => {
  return queryClient.getQueryData<IConversationDataQueryData>(
    getConversationDataQueryOptions(args).queryKey
  );
};

export function getOrFetchConversationData(args: IArgs) {
  const data = getConversationDataQueryData(args);
  if (data) {
    return Promise.resolve(data);
  }
  return queryClient.fetchQuery(getConversationDataQueryOptions(args));
}

export function updateConversationDataQueryData(
  args: IArgs & { updateData: Partial<IConversationDataQueryData> }
) {
  const { updateData } = args;
  queryClient.setQueryData<IConversationDataQueryData>(
    getConversationDataQueryOptions(args).queryKey,
    (previousData) => {
      return {
        // By default, if we didn't have any data for this conversation, we put those values
        isDeleted: false,
        isPinned: false,
        markedAsUnread: false,
        ...(previousData ?? {}),
        ...updateData,
      };
    }
  );
}

async function getConversationData(args: IArgs) {
  logger.debug(
    `[ConversationDataQuery] getConversationData for account: ${args.account}, topic: ${args.topic} and context: ${args.context}`
  );
  return batchedGetConversationTopicData.fetch(args);
}

const batchedGetConversationTopicData = create({
  scheduler: windowScheduler(50),
  resolver: (items, query) => {
    const match = items.find(
      (item) =>
        conversationDataQueryKey(query.account, query.topic).join("-") ===
        conversationDataQueryKey(item.account, item.topic).join("-")
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
