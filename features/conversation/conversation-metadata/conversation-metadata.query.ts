import { getConversationMetadata } from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import { conversationMetadataQueryKey } from "@/queries/QueryKeys";
import { queryOptions, skipToken } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "../../../queries/queryClient";

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
    (previousData) => ({
      account: args.account,
      topic: args.topic,
      deleted: false,
      pinned: false,
      unread: false,
      updatedAt: new Date().toISOString(),
      ...(previousData ?? {}),
      ...updateData,
    })
  );
}

// TODO: Add back later when we're back at optimizing queries
// Was used to batch the requests so we can make 1 request to get all the conversation metadata
// const batchedGetConversationMetadata = create({
//   scheduler: windowScheduler(50),
//   resolver: (items, query) => {
//     const match = items.find(
//       (item) =>
//         conversationMetadataQueryKey(query.account, query.topic).join("-") ===
//         conversationMetadataQueryKey(item.account, item.topic).join("-")
//     );
//     if (!match) {
//       return null;
//     }

//     const { account, topic, ...backendProperties } = match;

//     // If we don't have any data for this conversation, we return null
//     if (Object.keys(backendProperties).length === 0) {
//       return null;
//     }

//     return match;
//   },
//   fetcher: async (args: IArgs[]) => {
//     const accountGroups = args.reduce((groups, arg) => {
//       groups[arg.account] = groups[arg.account] || [];
//       groups[arg.account].push(arg);
//       return groups;
//     }, {} as Record<string, IArgs[]>);

//     const results = await Promise.all(
//       Object.entries(accountGroups).map(async ([account, groupArgs]) => {
//         const conversationsData = await getConversationMetadatas({
//           account,
//           topics: groupArgs.map((arg) => arg.topic),
//         });

//         // Include topic in each item for resolver matching
//         return groupArgs.map((arg) => ({
//           ...conversationsData[arg.topic],
//           account,
//           topic: arg.topic,
//         }));
//       })
//     );

//     return results.flat();
//   },
// });
