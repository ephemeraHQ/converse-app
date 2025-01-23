/**
 * useGroupQuery is derived from useConversationQuery. Like useDmQuery, maybe worth considering if we should just use useConversationQuery instead.
 */
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { queryClient } from "@/queries/queryClient";
import {
  ConversationQueryData,
  getConversationQueryOptions,
  getOrFetchConversation,
} from "@/queries/useConversationQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export function useGroupQuery(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return useQuery(
    getGroupQueryOptions({
      account,
      topic,
    })
  );
}

export function getGroupQueryData(
  args: {
    account: string;
    topic: ConversationTopic;
  } // Hate having this return type but for some reason the query is infering a DM or a Group even tho we have a select that filters for GroupWithCodecsType...
): GroupWithCodecsType | null | undefined {
  const { account, topic } = args;
  return queryClient.getQueryData(
    getGroupQueryOptions({
      account,
      topic,
    }).queryKey
  );
}

export function setGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
  group: GroupWithCodecsType;
}) {
  const { account, topic, group } = args;
  queryClient.setQueryData(
    getGroupQueryOptions({
      account,
      topic,
    }).queryKey,
    group
  );
}

export function getGroupQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryOptions({
    ...getConversationQueryOptions({
      account,
      topic,
    }),
    select: (data) => {
      if (!data) {
        return null;
      }
      if (!isConversationGroup(data)) {
        throw new Error(
          "Expected group conversation but received different type"
        );
      }
      return data;
    },
  });
}

export function updateGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
  updates: Partial<ConversationQueryData>;
}) {
  queryClient.setQueryData(
    getGroupQueryOptions(args).queryKey,
    (previousGroup) => {
      if (!previousGroup) {
        return undefined;
      }
      return updateObjectAndMethods(previousGroup, args.updates);
    }
  );
}

export function getOrFetchGroupQuery(args: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) {
  return getOrFetchConversation(args);
}
