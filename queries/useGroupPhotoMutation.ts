import { useMutation } from "@tanstack/react-query";

import { captureError } from "@/utils/capture-error";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import {
  getGroupQueryData,
  setGroupQueryData,
  useGroupQuery,
} from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { setGroupPhotoMutationKey } from "./MutationKeys";

export const useGroupPhotoMutation = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });
  return useMutation({
    mutationKey: setGroupPhotoMutationKey(account, topic),
    mutationFn: async (groupPhoto: string) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.updateGroupImageUrlSquare(groupPhoto);
      return groupPhoto;
    },
    onMutate: async (groupPhoto: string) => {
      const previousGroup = getGroupQueryData({ account, topic });
      setGroupQueryData({
        account,
        topic,
        group: {
          ...group,
          imageUrlSquare: groupPhoto,
        } as GroupWithCodecsType,
      });
      return { previousGroup };
    },
    onError: (error, _variables, context) => {
      captureError(error);
      if (context?.previousGroup === undefined) {
        return;
      }
      setGroupQueryData({
        account,
        topic,
        group: context.previousGroup,
      });
    },
  });
};
