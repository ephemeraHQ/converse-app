import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupNameMutationKey } from "./MutationKeys";
import { InboxId } from "@xmtp/react-native-sdk";
import { updateConversationInConversationListQuery } from "./useConversationListQuery";

export function useGroupNameMutation({
  inboxId,
  topic,
}: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) {
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useMutation({
    mutationKey: setGroupNameMutationKey({ inboxId, topic }),
    mutationFn: async (name: string) => {
      if (!group || !inboxId || !topic) {
        throw new Error("Missing required data in useGroupNameMutation");
      }

      await group.updateGroupName(name);
      return name;
    },
    onMutate: async (name: string) => {
      const previousGroup = getGroupQueryData({ inboxId, topic });
      const updates = { name };

      if (previousGroup) {
        updateGroupQueryData({ inboxId, topic, updates });
      }

      updateConversationInConversationListQuery({
        inboxId,
        topic,
        conversationUpdate: updates,
      });

      return { previousGroup };
    },
    onError: (error, _variables, context) => {
      captureError(error);

      const { previousGroup } = context || {};

      const updates = { name: previousGroup?.name ?? "" };
      updateGroupQueryData({ inboxId, topic, updates });
      updateConversationInConversationListQuery({
        inboxId,
        topic,
        conversationUpdate: updates,
      });
    },
  });
}
