import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCurrentInboxId } from "../data/store/accountsStore";
import { useGroupPhotoMutation } from "../queries/useGroupPhotoMutation";
import { useGroupPhotoQuery } from "../queries/useGroupPhotoQuery";

export const useGroupPhotoForCurrentInbox = (args: {
  topic: ConversationTopic;
}) => {
  const { topic } = args;
  const inboxId = useCurrentInboxId()!;
  const { data, isLoading, isError } = useGroupPhotoQuery({
    inboxId,
    topic,
  });
  const { mutateAsync } = useGroupPhotoMutation({
    inboxId,
    topic,
  });

  return {
    groupPhoto: data,
    isLoading,
    isError,
    setGroupPhoto: mutateAsync,
  };
};
