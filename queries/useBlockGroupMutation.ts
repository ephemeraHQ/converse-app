import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { captureError } from "@/utils/capture-error";
import { useMutation } from "@tanstack/react-query";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { updateConsentForGroupsForAccount } from "@/features/consent/update-consent-for-groups-for-account";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { blockGroupMutationKey } from "./MutationKeys";
import {
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "../features/consent/use-group-consent.query";

export const useBlockGroupMutation = (
  account: string,
  topic: ConversationTopic
) => {
  return useMutation({
    mutationKey: blockGroupMutationKey(account, topic!),
    mutationFn: async () => {
      if (!topic || !account) {
        return;
      }
      await updateConsentForGroupsForAccount({
        account,
        groupIds: [getV3IdFromTopic(topic)],
        consent: "deny",
      });
      return "denied";
    },
    onMutate: async () => {
      const previousConsent = getGroupConsentQueryData(account, topic!);
      setGroupConsentQueryData(account, topic!, "denied");
      updateConversationInConversationsQueryData({
        account,
        topic: topic!,
        conversationUpdate: {
          state: "denied",
        },
      });
      return { previousConsent };
    },
    onError: (error, _variables, context) => {
      captureError(error);

      if (!context) {
        return;
      }

      setGroupConsentQueryData(
        account,
        topic!,
        context.previousConsent || "unknown"
      );
      updateConversationInConversationsQueryData({
        account,
        topic: topic!,
        conversationUpdate: {
          state: context.previousConsent,
        },
      });
    },
    onSuccess: () => {
      logger.debug("onSuccess useBlockGroupMutation");
    },
  });
};
