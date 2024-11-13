import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { groupMessagesQueryKey } from "./QueryKeys";
import { entify, EntityObject } from "./entify";
import { useGroupConversationScreenQuery } from "./useGroupQuery";
import { useRefreshOnFocus } from "./useRefreshOnFocus";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { queryClient } from "./queryClient";
import logger from "@utils/logger";
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";

export type EntifiedMessagesType = EntityObject<DecodedMessageWithCodecsType>;

export const useGroupMessages = (
  account: string,
  topic: string,
  options?: Partial<UseQueryOptions<EntifiedMessagesType>>
) => {
  const { data: group } = useGroupConversationScreenQuery(
    account,
    topic,
    cacheOnlyQueryOptions
  );

  const queryData = useQuery({
    queryKey: groupMessagesQueryKey(account, topic),
    queryFn: async () => {
      logger.info("[Crash Debug] queryFn fetching messages");
      if (!group) {
        return {
          ids: [],
          byId: {},
        };
      }
      const messages = await group.messages();
      return entify(messages, (message) => message.id);
    },
    enabled: !!group,
    ...options,
  });
  useRefreshOnFocus(async (): Promise<void> => {
    if (options?.refetchOnWindowFocus) {
      await queryData.refetch();
    }
  });

  return queryData;
};

export const getGroupMessages = (account: string, topic: string) => {
  return queryClient.getQueryData<EntifiedMessagesType>(
    groupMessagesQueryKey(account, topic)
  );
};

const setGroupMessages = (
  account: string,
  topic: string,
  messages: EntifiedMessagesType
) => {
  queryClient.setQueryData(groupMessagesQueryKey(account, topic), messages);
};

export const addGroupMessage = (
  account: string,
  topic: string,
  message: DecodedMessageWithCodecsType
) => {
  const previousMessages = getGroupMessages(account, topic);
  if (!previousMessages) {
    setGroupMessages(account, topic, {
      ids: [message.id],
      byId: { [message.id]: message },
    });
    return;
  }
  setGroupMessages(account, topic, {
    ids: [message.id, ...previousMessages.ids],
    byId: { ...previousMessages.byId, [message.id]: message },
  });
};
