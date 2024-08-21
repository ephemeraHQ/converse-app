import { useGroupId } from "@hooks/useGroupId";
import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { consentToGroupsOnProtocol } from "@utils/xmtpRN/conversations";

import { allowGroupMutationKey } from "./MutationKeys";
import {
  cancelGroupConsentQuery,
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "./useGroupConsentQuery";

export const useAllowGroupMutation = (account: string, topic: string) => {
  const { groupId } = useGroupId(topic);
  return useMutation({
    mutationKey: allowGroupMutationKey(account, topic),
    mutationFn: async () => {
      if (!groupId || !account) {
        return;
      }
      await consentToGroupsOnProtocol(account, [groupId], "allow");
      return "allowed";
    },
    onMutate: async () => {
      await cancelGroupConsentQuery(account, topic);
      const previousConsent = getGroupConsentQueryData(account, topic);
      setGroupConsentQueryData(account, topic, "allowed");
      return { previousConsent };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useAllowGroupMutation");
      sentryTrackError(error);
      if (context?.previousConsent === undefined) {
        return;
      }
      setGroupConsentQueryData(account, topic, context.previousConsent);
    },
    onSuccess: () => {
      logger.debug("onSuccess useAllowGroupMutation");
    },
  });
};
