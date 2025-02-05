/**
 * useGroupQuery is derived from useConversationQuery. Like useDmQuery, maybe worth considering if we should just use useConversationQuery instead.
 */
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import {
  ConversationQueryData,
  getConversationQueryData,
  getConversationQueryOptions,
  getOrFetchConversation,
  setConversationQueryData,
  updateConversationQueryData,
} from "@/queries/conversation-query";
import { GroupWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
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

export function getGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return getConversationQueryData(args) as
    | GroupWithCodecsType
    | null
    | undefined;
}

export function setGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
  group: GroupWithCodecsType;
}) {
  const { account, topic, group } = args;
  setConversationQueryData({
    account,
    topic,
    conversation: group,
  });
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
  updateConversationQueryData({
    account: args.account,
    topic: args.topic,
    conversationUpdate: args.updates,
  });
}

export function getOrFetchGroupQuery(args: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) {
  return getOrFetchConversation(args);
}
