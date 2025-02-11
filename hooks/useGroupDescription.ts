import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useGroupDescriptionMutation } from "../queries/useGroupDescriptionMutation";
import { useGroupDescriptionQuery } from "../queries/useGroupDescriptionQuery";
import { getSafeCurrentSender } from "@/features/multi-inbox/multi-inbox.store";

export const useGroupDescription = (topic: ConversationTopic) => {
  const account = getSafeCurrentSender().ethereumAddress;
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
