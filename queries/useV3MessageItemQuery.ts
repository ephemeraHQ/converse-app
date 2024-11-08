import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupConversationScreenQuery } from "./useGroupQuery";
import { useGroupMessages } from "./useGroupMessages";

export const useV3MessageItemQuery = (topic: string, id: string) => {
  const currentAccount = useCurrentAccount()!;

  const { data: group } = useGroupConversationScreenQuery(
    currentAccount,
    topic,
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const { data: messages } = useGroupMessages(currentAccount, topic, {
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return messages?.byId[id];
};
