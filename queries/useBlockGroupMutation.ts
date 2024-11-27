import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { consentToGroupsOnProtocolByAccount } from "@utils/xmtpRN/contacts";

import { blockGroupMutationKey } from "./MutationKeys";
import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";

export const useBlockGroupMutation = (
  account: string,
  topic: ConversationTopic | undefined
) => {
  return useMutation({
    mutationKey: blockGroupMutationKey(account, topic!),
    mutationFn: async () => {
      if (!topic || !account) {
        return;
      }
      await consentToGroupsOnProtocolByAccount({
        account,
        groupIds: [getV3IdFromTopic(topic)],
        consent: "deny",
      });
      return "denied";
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic!);
      const previousConsent = getGroupConsentQueryData(account, topic!);
      setGroupConsentQueryData(account, topic!, "denied");
      return { previousConsent };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useDenyGroupMutation");
      sentryTrackError(error);
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic!, context.previousConsent);
    },
    onSuccess: () => {
      logger.debug("onSuccess useDenyGroupMutation");
    },
  });
};
