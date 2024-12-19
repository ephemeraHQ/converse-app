import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupNameMutationKey } from "./MutationKeys";
import { updateConversationInConversationListQuery } from "@/queries/useConversationListQuery";

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

export function useGroupNameMutation(args: IArgs) {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: setGroupNameMutationKey(account, topic),
    mutationFn: async (name: string) => {
      if (!group || !account || !topic) {
        throw new Error("Missing required data in useGroupNameMutation");
      }

      await group.updateGroupName(name);
      return name;
    },
    onMutate: async (name: string) => {
      const previousGroup = getGroupQueryData({ account, topic });
      const updates = { name };

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

      const updates = { name: previousGroup?.name ?? "" };
      updateGroupQueryData({ account, topic, updates });
      updateConversationInConversationListQuery({
        account,
        topic,
        conversationUpdate: updates,
      });
    },
  });
}
