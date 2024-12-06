import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";

import { setGroupPhotoMutationKey } from "./MutationKeys";
import {
  cancelGroupPhotoQuery,
  getGroupPhotoQueryData,
} from "./useGroupPhotoQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { handleGroupImageUpdate } from "@/utils/groupUtils/handleGroupImageUpdate";

export const useGroupPhotoMutation = (
  account: string,
  topic: ConversationTopic
) => {
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
      handleGroupImageUpdate({ account, topic, image: groupPhoto });
      return { previousGroupPhoto };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useGroupPhotoMutation");
      sentryTrackError(error);
      if (context?.previousGroupPhoto === undefined) {
        return;
      }
      handleGroupImageUpdate({
        account,
        topic,
        image: context.previousGroupPhoto,
      });
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useGroupPhotoMutation");
      // refreshGroup(account, topic);
    },
  });
};
