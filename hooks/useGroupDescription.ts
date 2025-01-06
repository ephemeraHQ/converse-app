import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";
import { useGroupDescriptionMutation } from "../queries/useGroupDescriptionMutation";
import { useGroupDescriptionQuery } from "../queries/useGroupDescriptionQuery";

export const useGroupDescription = (topic: ConversationTopic) => {
  const inboxId = getCurrentInboxId();
  const { data, isLoading, isError } = useGroupDescriptionQuery({
    account,
    topic,
  });
  const { mutateAsync } = useGroupDescriptionMutation({
    account,
    topic,
  });

  return {
    groupDescription: data,
    isLoading,
    isError,
    setGroupDescription: mutateAsync,
  };
};
