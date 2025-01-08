import { updateConversationInConversationListQuery } from "@/queries/useConversationListForCurrentUserQuery";
import { captureError } from "@/utils/capture-error";
import { useMutation } from "@tanstack/react-query";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { consentToGroupsByGroupIds } from "@utils/xmtpRN/contacts";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { blockGroupMutationKey } from "./MutationKeys";
import {
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";

export const useBlockGroupMutation = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  return useMutation({
    mutationKey: blockGroupMutationKey({ inboxId, topic }),
    mutationFn: async () => {
      if (!topic || !inboxId) {
        return;
      }
      await consentToGroupsByGroupIds({
        inboxId,
        groupIds: [getV3IdFromTopic(topic)],
        consent: "deny",
      });
      return "denied";
    },
    onMutate: async () => {
      const previousConsent = getGroupConsentQueryData(inboxId, topic!);
      setGroupConsentQueryData(inboxId, topic!, "denied");
      updateConversationInConversationListQuery({
        inboxId,
        topic,
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

      setGroupConsentQueryData(inboxId, topic!, context.previousConsent);
      updateConversationInConversationListQuery({
        inboxId,
        topic,
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
