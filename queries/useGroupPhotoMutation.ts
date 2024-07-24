import { useMutation } from "@tanstack/react-query";

import { setGroupPhotoMutationKey } from "./MutationKeys";
import {
  cancelGroupPhotoQuery,
  getGroupPhotoQueryData,
  setGroupPhotoQueryData,
} from "./useGroupPhotoQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useGroupPhotoMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
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
      await cancelGroupPhotoQuery(account, topic);
      const previousGroupPhoto = getGroupPhotoQueryData(account, topic);
      setGroupPhotoQueryData(account, topic, groupPhoto);
      return { previousGroupPhoto };
    },
    // eslint-disable-next-line node/handle-callback-err
    onError: (_error, _variables, context) => {
      console.log("onError useGroupPhotoMutation");
      if (context?.previousGroupPhoto === undefined) {
        return;
      }
      setGroupPhotoQueryData(account, topic, context.previousGroupPhoto);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess useGroupPhotoMutation");
      refreshGroup(account, topic);
    },
  });
};
