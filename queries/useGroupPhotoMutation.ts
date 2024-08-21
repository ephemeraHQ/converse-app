import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";

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
    onError: (error, _variables, context) => {
      logger.warn("onError useGroupPhotoMutation");
      sentryTrackError(error);
      if (context?.previousGroupPhoto === undefined) {
        return;
      }
      setGroupPhotoQueryData(account, topic, context.previousGroupPhoto);
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useGroupPhotoMutation");
      refreshGroup(account, topic);
    },
  });
};
