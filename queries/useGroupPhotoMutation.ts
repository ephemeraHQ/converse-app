import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { setGroupPhotoMutationKey } from "./MutationKeys";
import { updateConversationInConversationListQuery } from "./useConversationListQuery";

type IArgs = {
  inboxId: InboxId;
  topic: ConversationTopic;
};

export function useGroupPhotoMutation(args: IArgs) {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useMutation({
    mutationKey: setGroupPhotoMutationKey({ inboxId, topic }),
    mutationFn: async (imageUrlSquare: string) => {
      if (!group || !inboxId || !topic) {
        throw new Error("Missing required data in useGroupPhotoMutation");
      }

      await group.updateGroupImageUrlSquare(imageUrlSquare);
      return imageUrlSquare;
    },
    onMutate: async (imageUrlSquare: string) => {
      const previousGroup = getGroupQueryData({ inboxId, topic });
      const updates = { imageUrlSquare };

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

      const updates = { imageUrlSquare: previousGroup?.imageUrlSquare ?? "" };
      updateGroupQueryData({ inboxId, topic, updates });
      updateConversationInConversationListQuery({
        inboxId,
        topic,
        conversationUpdate: updates,
      });
    },
  });
}
