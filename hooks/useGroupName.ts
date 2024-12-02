import { currentAccount } from "../data/store/accountsStore";
import { useGroupNameMutation } from "../queries/useGroupNameMutation";
import { useGroupNameQuery } from "../queries/useGroupNameQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupName = (topic: ConversationTopic | undefined) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupNameQuery(account, topic!);
  const { mutateAsync } = useGroupNameMutation(account, topic!);

  return {
    groupName: data,
    isLoading,
    isError,
    setGroupName: mutateAsync,
  };
};
