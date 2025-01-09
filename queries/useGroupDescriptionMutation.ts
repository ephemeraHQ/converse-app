import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { setGroupDescriptionMutationKey } from "./MutationKeys";
import { updateConversationInConversationListQuery } from "@/queries/useConversationListForCurrentUserQuery";

type IArgs = {
  inboxId: InboxId;
  topic: ConversationTopic;
};

export function useGroupDescriptionMutation(args: IArgs) {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useMutation({
    mutationKey: setGroupDescriptionMutationKey({ inboxId, topic }),
    mutationFn: async (description: string) => {
      if (!group || !inboxId || !topic) {
        throw new Error("Missing required data in useGroupDescriptionMutation");
      }

      await group.updateGroupDescription(description);
      return description;
    },
    onMutate: async (description: string) => {
      const previousGroup = getGroupQueryData({ inboxId, topic });
      const updates = { description };

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

      const updates = { description: previousGroup?.description ?? "" };
      updateGroupQueryData({ inboxId, topic, updates });
      updateConversationInConversationListQuery({
        inboxId,
        topic,
        conversationUpdate: updates,
      });
    },
  });
}
