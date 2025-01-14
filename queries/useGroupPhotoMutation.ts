import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupPhotoMutationKey } from "./MutationKeys";
import { updateConversationInConversationsQuery } from "@/queries/conversations-query";

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

export function useGroupPhotoMutation(args: IArgs) {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: setGroupPhotoMutationKey(account, topic),
    mutationFn: async (imageUrlSquare: string) => {
      if (!group || !account || !topic) {
        throw new Error("Missing required data in useGroupPhotoMutation");
      }

      await group.updateGroupImageUrlSquare(imageUrlSquare);
      return imageUrlSquare;
    },
    onMutate: async (imageUrlSquare: string) => {
      const previousGroup = getGroupQueryData({ account, topic });
      const updates = { imageUrlSquare };

      if (previousGroup) {
        updateGroupQueryData({ account, topic, updates });
      }

      updateConversationInConversationsQuery({
        account,
        topic,
        conversationUpdate: updates,
      });

      return { previousGroup };
    },
    onError: (error, _variables, context) => {
      captureError(error);

      const { previousGroup } = context || {};

      const updates = { imageUrlSquare: previousGroup?.imageUrlSquare ?? "" };
      updateGroupQueryData({ account, topic, updates });
      updateConversationInConversationsQuery({
        account,
        topic,
        conversationUpdate: updates,
      });
    },
  });
}
