import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";
import { useGroupNameMutation } from "../queries/useGroupNameMutation";
import { useGroupNameQuery } from "../queries/useGroupNameQuery";

export const useGroupName = (topic: ConversationTopic | undefined) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupNameQuery({
    account,
    topic: topic!,
  });
  const { mutateAsync } = useGroupNameMutation({
    account,
    topic: topic!,
  });

  return {
    groupName: data,
    isLoading,
    isError,
    updateGroupName: mutateAsync,
  };
};
