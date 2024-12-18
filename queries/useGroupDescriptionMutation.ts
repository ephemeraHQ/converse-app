import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupDescriptionMutationKey } from "./MutationKeys";
import { updateConversationInConversationListQuery } from "@/queries/useConversationListQuery";

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

export function useGroupDescriptionMutation(args: IArgs) {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: setGroupDescriptionMutationKey(account, topic),
    mutationFn: async (description: string) => {
      if (!group || !account || !topic) {
        throw new Error("Missing required data in useGroupDescriptionMutation");
      }

      await group.updateGroupDescription(description);
      return description;
    },
    onMutate: async (description: string) => {
      const previousGroup = getGroupQueryData({ account, topic });
      const updates = { description };

      if (previousGroup) {
        updateGroupQueryData({ account, topic, updates });
      }

      updateConversationInConversationListQuery({
        account,
        topic,
        conversationUpdate: updates,
      });

      return { previousGroup };
    },
    onError: (error, _variables, context) => {
      captureError(error);

      const { previousGroup } = context || {};

      const updates = { description: previousGroup?.description ?? "" };
      updateGroupQueryData({ account, topic, updates });
      updateConversationInConversationListQuery({
        account,
        topic,
        conversationUpdate: updates,
      });
    },
  });
}
