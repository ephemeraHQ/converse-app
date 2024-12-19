import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCurrentAccount } from "../data/store/accountsStore";
import { useGroupPhotoMutation } from "../queries/useGroupPhotoMutation";
import { useGroupPhotoQuery } from "../queries/useGroupPhotoQuery";

export const useGroupPhoto = (topic: ConversationTopic) => {
  const account = useCurrentAccount();
  const { data, isLoading, isError } = useGroupPhotoQuery({
    account: account ?? "",
    topic,
  });
  const { mutateAsync } = useGroupPhotoMutation({
    account: account ?? "",
    topic,
  });

  return {
    groupPhoto: data,
    isLoading,
    isError,
    setGroupPhoto: mutateAsync,
  };
};
