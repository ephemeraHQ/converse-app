import { conversationMetadataQueryKey } from "@/queries/QueryKeys";
import { getTopics } from "@/utils/api/topics";
import logger from "@/utils/logger";
import { queryOptions, skipToken } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { create, windowScheduler } from "@yornaath/batshit";
import { queryClient } from "./queryClient";

export type IConversationMetadataQueryData = Awaited<
  ReturnType<typeof getConversationMetadata>
>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

export function getConversationMetadataQueryOptions({ account, topic }: IArgs) {
  const enabled = !!topic && !!account;
  return queryOptions({
    queryKey: conversationMetadataQueryKey(account, topic),
    queryFn: enabled
      ? () => getConversationMetadata({ account, topic })
      : skipToken,
    enabled,
  });
}

export function prefetchConversationMetadataQuery(
  account: string,
  topic: ConversationTopic
) {
  return queryClient.prefetchQuery(
    getConversationMetadataQueryOptions({ account, topic })
  );
}

export const getConversationMetadataQueryData = (args: IArgs) => {
  const { account, topic } = args;
  return queryClient.getQueryData(
    getConversationMetadataQueryOptions({ account, topic }).queryKey
  );
};

export function updateConversationMetadataQueryData(
  args: IArgs & { updateData: Partial<IConversationMetadataQueryData> }
) {
  const { updateData, account, topic } = args;
  queryClient.setQueryData(
    getConversationMetadataQueryOptions({ account, topic }).queryKey,
    (previousData) => {
      return {
        account: args.account,
        topic: args.topic,
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

async function getConversationMetadata(args: IArgs) {
  logger.debug(
    `[ConversationMetadataQuery] getConversationMetadata for account: ${args.account}, topic: ${args.topic}`
  );
  return batchedGetConversationMetadata.fetch(args);
}

const batchedGetConversationMetadata = create({
  scheduler: windowScheduler(50),
  resolver: (items, query) => {
    const match = items.find(
      (item) =>
        conversationMetadataQueryKey(query.account, query.topic).join("-") ===
        conversationMetadataQueryKey(item.account, item.topic).join("-")
    );
    if (!match) {
      return null;
    }

    const { account, topic, ...backendProperties } = match;

    // If we don't have any data for this conversation, we return null
    if (Object.keys(backendProperties).length === 0) {
      return null;
    }

    return match;
  },
  fetcher: async (args: IArgs[]) => {
    const accountGroups = args.reduce((groups, arg) => {
      groups[arg.account] = groups[arg.account] || [];
      groups[arg.account].push(arg);
      return groups;
    }, {} as Record<string, IArgs[]>);

    const results = await Promise.all(
      Object.entries(accountGroups).map(async ([account, groupArgs]) => {
        const conversationsData = await getTopics({
          account,
          topics: groupArgs.map((arg) => arg.topic),
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
