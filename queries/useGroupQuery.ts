/**
 * useGroupQuery is derived from useConversationQuery. Like useDmQuery, maybe worth considering if we should just use useConversationQuery instead.
 */
import {
  getConversationQueryData,
  getConversationQueryOptions,
  setConversationQueryData,
  useConversationQuery,
} from "@/queries/useConversationQuery";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { UseQueryResult } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export function useGroupQuery(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return useConversationQuery({
    account,
    topic,
  }) as UseQueryResult<GroupWithCodecsType | null>;
}

export function getGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return getConversationQueryData({ account, topic }) as
    | GroupWithCodecsType
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
  return getConversationQueryOptions({ account, topic });
}

export function updateGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
  updates: Partial<GroupWithCodecsType>;
}) {
  const { account, topic, updates } = args;
  const previousGroup = getGroupQueryData({ account, topic });
  if (!previousGroup) {
    return;
  }
  setGroupQueryData({
    account,
    topic,
    group: mutateObjectProperties(previousGroup, updates),
  });
}
