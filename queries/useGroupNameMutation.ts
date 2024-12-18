import { captureError } from "@/utils/capture-error";
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import { useMutation } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupNameMutationKey } from "./MutationKeys";

export const useGroupNameMutation = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });
  return useMutation({
    mutationKey: setGroupNameMutationKey(account, topic),
    mutationFn: async (groupName: string) => {
      if (!group || !account || !topic) {
        throw new Error(
          "Missing group, account, or topic in useGroupNameMutation"
        );
      }
      group.updateGroupName(groupName);
      return groupName;
    },
    onMutate: async (groupName: string) => {
      const previousGroup = getGroupQueryData({ account, topic });
      if (previousGroup) {
        updateGroupQueryData({
          account,
          topic,
          updates: {
            name: groupName,
          },
        });
      }
      return { previousGroupName: previousGroup?.name };
    },
    onError: (error, _variables, context) => {
      captureError(error);
      const { previousGroupName } = context || {};
      if (previousGroupName) {
        updateGroupQueryData({
          account,
          topic,
          updates: {
            name: previousGroupName,
          },
        });
      }
    },
  });
};
