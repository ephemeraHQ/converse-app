import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupDescriptionMutationKey } from "./MutationKeys";

export const useGroupDescriptionMutation = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery({ account, topic });
  return useMutation({
    mutationKey: setGroupDescriptionMutationKey(account, topic),
    mutationFn: async (description: string) => {
      if (!group || !account || !topic) {
        throw new Error(
          "Missing group, account, or topic in useGroupDescriptionMutation"
        );
      }
      group.updateGroupDescription(description);
      return description;
    },
    onMutate: async (description: string) => {
      const previousGroup = getGroupQueryData({ account, topic });
      if (previousGroup) {
        updateGroupQueryData({
          account,
          topic,
          updates: {
            description,
          },
        });
      }

      return { previousGroupDescription: previousGroup?.description };
    },
    onError: (error, _variables, context) => {
      captureError(error);
      const { previousGroupDescription } = context || {};

      if (previousGroupDescription) {
        updateGroupQueryData({
          account,
          topic,
          updates: {
            description: previousGroupDescription,
          },
        });
      }
    },
  });
};
