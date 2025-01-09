import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { getCurrentInboxId } from "@/data/store/accountsStore";
import { useGroupDescriptionMutation } from "../queries/useGroupDescriptionMutation";
import { useGroupDescriptionQuery } from "../queries/useGroupDescriptionQuery";

export const useGroupDescriptionForCurrentInbox = ({
  topic,
}: {
  topic: ConversationTopic;
}) => {
  const inboxId = getCurrentInboxId()!;
  const { data, isLoading, isError } = useGroupDescriptionQuery({
    inboxId,
    topic,
  });
  const { mutateAsync } = useGroupDescriptionMutation({
    inboxId,
    topic,
  });

  return {
    groupDescription: data,
    isLoading,
    isError,
    setGroupDescription: mutateAsync,
  };
};
