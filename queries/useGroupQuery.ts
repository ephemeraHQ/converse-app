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
  inboxId: InboxId;
  topic: ConversationTopic;
}) {
  const { inboxId, topic } = args;
  return useConversationQuery({
    inboxId,
    topic,
  }) as UseQueryResult<GroupWithCodecsType | null>;
}

export function getGroupQueryData(args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) {
  const { inboxId, topic } = args;
  return getConversationQueryData({ inboxId, topic }) as
    | GroupWithCodecsType
    | undefined;
}

export function setGroupQueryData(args: {
  inboxId: InboxId;
  topic: ConversationTopic;
  group: GroupWithCodecsType;
}) {
  const { inboxId, topic, group } = args;
  setConversationQueryData({
    inboxId,
    topic,
    conversation: group,
  });
}

export function getGroupQueryOptions(args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) {
  const { inboxId, topic } = args;
  return getConversationQueryOptions({ inboxId, topic });
}

export function updateGroupQueryData(args: {
  inboxId: InboxId;
  topic: ConversationTopic;
  updates: Partial<GroupWithCodecsType>;
}) {
  const { inboxId, topic, updates } = args;
  const previousGroup = getGroupQueryData({ inboxId, topic });
  if (!previousGroup) {
    return;
  }
  setGroupQueryData({
    inboxId,
    topic,
    group: mutateObjectProperties(previousGroup, updates),
  });
}
