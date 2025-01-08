import {
  getGroupQueryData,
  getGroupQueryOptions,
  setGroupQueryData,
} from "@/queries/useGroupQuery";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useQuery } from "@tanstack/react-query";
import type { ConsentState, ConversationTopic } from "@xmtp/react-native-sdk";

type IGroupConsentQueryArgs = {
  inboxId: string | undefined;
  topic: ConversationTopic;
};

export const useGroupConsentQuery = (args: IGroupConsentQueryArgs) => {
  const { inboxId, topic } = args;
  return useQuery({
    ...getGroupQueryOptions({ inboxId, topic }),
    select: (group) => group?.state,
  });
};

export const getGroupConsentQueryData = (
  inboxId: string | undefined,
  topic: ConversationTopic
) => {
  const group = getGroupQueryData({ inboxId, topic });
  return group?.state;
};

export const setGroupConsentQueryData = (
  inboxId: string | undefined,
  topic: ConversationTopic,
  consent: ConsentState | undefined
) => {
  const currentGroup = getGroupQueryData({ inboxId, topic });
  if (!currentGroup) return;
  setGroupQueryData({
    inboxId,
    topic,
    group: { ...currentGroup, state: consent } as GroupWithCodecsType,
  });
};
